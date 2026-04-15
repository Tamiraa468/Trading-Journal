import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthChallenge,
  sanitizeNextPath,
  setGoogleOAuthCookies,
} from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  try {
    const nextPath = sanitizeNextPath(req.nextUrl.searchParams.get("next"));
    const challenge = createGoogleOAuthChallenge(nextPath);

    const authorizationUrl = buildGoogleAuthorizationUrl(req, {
      state: challenge.state,
      nonce: challenge.nonce,
      codeChallenge: challenge.codeChallenge,
    });

    const response = NextResponse.redirect(authorizationUrl);
    setGoogleOAuthCookies(response, {
      state: challenge.state,
      nonce: challenge.nonce,
      codeVerifier: challenge.codeVerifier,
      nextPath: challenge.nextPath,
    });

    return response;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Google OAuth start failed.", err);
    }

    return Response.json({ error: "Google auth is unavailable." }, { status: 500 });
  }
}
