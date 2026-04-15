import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { shouldUseSecureCookie } from "@/lib/jwt";

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const GOOGLE_OAUTH_MAX_AGE_SECONDS = 60 * 10;

const GOOGLE_OAUTH_STATE_COOKIE = "tj_google_oauth_state";
const GOOGLE_OAUTH_NONCE_COOKIE = "tj_google_oauth_nonce";
const GOOGLE_OAUTH_VERIFIER_COOKIE = "tj_google_oauth_verifier";
const GOOGLE_OAUTH_NEXT_COOKIE = "tj_google_oauth_next";

function getRequiredGoogleEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return req.nextUrl.origin;
  }

  throw new Error("Missing required environment variable: APP_BASE_URL");
}

function getGoogleCallbackUrl(req: NextRequest): string {
  return new URL("/api/auth/google/callback", getBaseUrl(req)).toString();
}

function makeGoogleOAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge,
  };
}

function normalizeNonEmptyString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function sanitizeNextPath(rawPath: string | null | undefined): string {
  const value = normalizeNonEmptyString(rawPath);
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/\\")) return "/dashboard";
  if (value.includes("\\")) return "/dashboard";
  if (value.includes("\n") || value.includes("\r")) return "/dashboard";

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/dashboard";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

export function createGoogleOAuthChallenge(nextPath: string) {
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    state,
    nonce,
    codeVerifier,
    codeChallenge,
    nextPath: sanitizeNextPath(nextPath),
  };
}

export function setGoogleOAuthCookies(
  response: NextResponse,
  values: {
    state: string;
    nonce: string;
    codeVerifier: string;
    nextPath: string;
  },
) {
  const options = makeGoogleOAuthCookieOptions(GOOGLE_OAUTH_MAX_AGE_SECONDS);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, values.state, options);
  response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, values.nonce, options);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, values.codeVerifier, options);
  response.cookies.set(
    GOOGLE_OAUTH_NEXT_COOKIE,
    sanitizeNextPath(values.nextPath),
    options,
  );
}

export function clearGoogleOAuthCookies(response: NextResponse) {
  const options = makeGoogleOAuthCookieOptions(0);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", options);
  response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, "", options);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, "", options);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, "", options);
}

export function readGoogleOAuthCookies(req: NextRequest) {
  return {
    state: req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value ?? "",
    nonce: req.cookies.get(GOOGLE_OAUTH_NONCE_COOKIE)?.value ?? "",
    codeVerifier: req.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value ?? "",
    nextPath: req.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value ?? "/dashboard",
  };
}

export function compareOpaqueValues(expected: string, actual: string): boolean {
  if (!expected || !actual) return false;

  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export function buildGoogleAuthorizationUrl(
  req: NextRequest,
  args: {
    state: string;
    nonce: string;
    codeChallenge: string;
  },
): URL {
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", getRequiredGoogleEnv("GOOGLE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", getGoogleCallbackUrl(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", args.state);
  url.searchParams.set("nonce", args.nonce);
  url.searchParams.set("code_challenge", args.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("prompt", "select_account");
  return url;
}

type GoogleTokenResponse = {
  id_token?: unknown;
};

export async function exchangeGoogleCodeForIdToken(args: {
  req: NextRequest;
  code: string;
  codeVerifier: string;
}): Promise<string> {
  const body = new URLSearchParams({
    client_id: getRequiredGoogleEnv("GOOGLE_CLIENT_ID"),
    client_secret: getRequiredGoogleEnv("GOOGLE_CLIENT_SECRET"),
    code: args.code,
    grant_type: "authorization_code",
    redirect_uri: getGoogleCallbackUrl(args.req),
    code_verifier: args.codeVerifier,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
  });

  const payload = (await response.json().catch(() => null)) as
    | GoogleTokenResponse
    | null;

  if (!response.ok || !payload || typeof payload.id_token !== "string") {
    throw new Error("Google token exchange failed.");
  }

  return payload.id_token;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string | null;
};

export async function verifyGoogleIdToken(args: {
  idToken: string;
  expectedNonce: string;
}): Promise<GoogleIdentity> {
  const clientId = getRequiredGoogleEnv("GOOGLE_CLIENT_ID");

  const { payload, protectedHeader } = await jwtVerify(args.idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
    algorithms: ["RS256"],
    clockTolerance: 10,
  });

  if (protectedHeader.alg !== "RS256") {
    throw new Error("Unsupported Google signing algorithm.");
  }

  const nonce = normalizeNonEmptyString(payload.nonce);
  if (!compareOpaqueValues(args.expectedNonce, nonce)) {
    throw new Error("Invalid Google nonce.");
  }

  const aud = payload.aud;
  const azp = normalizeNonEmptyString(payload.azp);
  if (Array.isArray(aud) && aud.length > 1 && azp !== clientId) {
    throw new Error("Invalid Google authorized party.");
  }

  const sub = normalizeNonEmptyString(payload.sub);
  const email = normalizeNonEmptyString(payload.email).toLowerCase();
  const emailVerified = payload.email_verified === true;

  if (!sub || !email || !emailVerified) {
    throw new Error("Invalid Google identity payload.");
  }

  const name = normalizeNonEmptyString(payload.name) || null;

  return {
    sub,
    email,
    name,
  };
}
