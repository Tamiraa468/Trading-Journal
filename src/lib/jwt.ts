import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const AUTH_COOKIE_NAME = "tj_session";

const DEFAULT_ALLOWED_ALGORITHMS = ["HS256"] as const;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAllowedAlgorithms(): string[] {
  const raw = process.env.JWT_ALLOWED_ALGORITHMS?.trim();
  if (!raw) {
    return [...DEFAULT_ALLOWED_ALGORITHMS];
  }
  return raw
    .split(",")
    .map((alg) => alg.trim())
    .filter(Boolean);
}

function getVerifyOptions() {
  const issuer = process.env.JWT_ISSUER?.trim() || undefined;
  const audience = process.env.JWT_AUDIENCE?.trim() || undefined;

  return {
    issuer,
    audience,
    algorithms: getAllowedAlgorithms(),
    clockTolerance: 5,
  };
}

function getSessionTtlSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN_SECONDS?.trim();
  if (!raw) return DEFAULT_SESSION_TTL_SECONDS;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid JWT_EXPIRES_IN_SECONDS value");
  }

  // Clamp to a sane range: 5 min - 7 days.
  return Math.min(Math.max(parsed, 60 * 5), 60 * 60 * 24 * 7);
}

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export async function signSessionToken(input: {
  sub: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const secret = getRequiredEnv("JWT_SECRET");
  const ttl = getSessionTtlSeconds();
  const { issuer, audience } = getVerifyOptions();

  let tokenBuilder = new SignJWT({
    email: input.email,
    ...(input.name ? { name: input.name } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`);

  if (issuer) {
    tokenBuilder = tokenBuilder.setIssuer(issuer);
  }

  if (audience) {
    tokenBuilder = tokenBuilder.setAudience(audience);
  }

  return tokenBuilder.sign(new TextEncoder().encode(secret));
}

export async function verifyJwtToken(token: string): Promise<JWTPayload> {
  const secret = getRequiredEnv("JWT_SECRET");
  const encodedSecret = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encodedSecret, getVerifyOptions());
  return payload;
}

export function getTokenMaxAgeSeconds(payload: JWTPayload): number {
  const now = Math.floor(Date.now() / 1000);
  const tokenExp = typeof payload.exp === "number" ? payload.exp : now + 60 * 60;
  const maxAge = tokenExp - now;

  // Cap to 7 days for cookie persistence, even if token has a longer lifetime.
  return Math.max(0, Math.min(maxAge, 60 * 60 * 24 * 7));
}

export function shouldUseSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}