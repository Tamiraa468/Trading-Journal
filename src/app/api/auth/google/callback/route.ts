import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearGoogleOAuthCookies,
  compareOpaqueValues,
  exchangeGoogleCodeForIdToken,
  readGoogleOAuthCookies,
  sanitizeNextPath,
  verifyGoogleIdToken,
} from "@/lib/google-oauth";
import { createSession, setSessionCookie } from "@/lib/session";

const GOOGLE_SUBJECT_PREFIX = "google_";

function buildSignInErrorUrl(
  req: NextRequest,
  errorCode: string,
  nextPath: string,
) {
  const url = new URL("/sign-in", req.url);
  url.searchParams.set("error", errorCode);
  url.searchParams.set("next", sanitizeNextPath(nextPath));
  return url;
}

export async function GET(req: NextRequest) {
  const oauthState = readGoogleOAuthCookies(req);
  const nextPath = sanitizeNextPath(oauthState.nextPath);

  const providerError = req.nextUrl.searchParams.get("error");
  if (providerError) {
    const denied = NextResponse.redirect(
      buildSignInErrorUrl(req, "google_denied", nextPath),
    );
    clearGoogleOAuthCookies(denied);
    return denied;
  }

  const state = req.nextUrl.searchParams.get("state") ?? "";
  const code = req.nextUrl.searchParams.get("code") ?? "";

  if (!state || !code || !oauthState.nonce || !oauthState.codeVerifier) {
    const failed = NextResponse.redirect(
      buildSignInErrorUrl(req, "google_failed", nextPath),
    );
    clearGoogleOAuthCookies(failed);
    return failed;
  }

  if (!compareOpaqueValues(oauthState.state, state)) {
    const invalidState = NextResponse.redirect(
      buildSignInErrorUrl(req, "google_state", nextPath),
    );
    clearGoogleOAuthCookies(invalidState);
    return invalidState;
  }

  try {
    const idToken = await exchangeGoogleCodeForIdToken({
      req,
      code,
      codeVerifier: oauthState.codeVerifier,
    });

    const identity = await verifyGoogleIdToken({
      idToken,
      expectedNonce: oauthState.nonce,
    });

    const externalSubject = `${GOOGLE_SUBJECT_PREFIX}${identity.sub}`;

    let user = await db.user.findUnique({
      where: { clerkId: externalSubject },
    });

    if (!user) {
      const existingEmailOwner = await db.user.findUnique({
        where: { email: identity.email },
      });

      if (existingEmailOwner) {
        const conflict = NextResponse.redirect(
          buildSignInErrorUrl(req, "google_conflict", nextPath),
        );
        clearGoogleOAuthCookies(conflict);
        return conflict;
      }

      user = await db.user.create({
        data: {
          clerkId: externalSubject,
          email: identity.email,
          name: identity.name,
          emailVerifiedAt: new Date(),
          passwordHash: null,
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? identity.name,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
    }

    const session = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const success = NextResponse.redirect(new URL(nextPath, req.url));
    clearGoogleOAuthCookies(success);
    setSessionCookie(success, session);
    return success;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Google OAuth callback failed.", err);
    }

    const failed = NextResponse.redirect(
      buildSignInErrorUrl(req, "google_failed", nextPath),
    );
    clearGoogleOAuthCookies(failed);
    return failed;
  }
}
