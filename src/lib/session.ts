import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  AUTH_COOKIE_NAME,
  getTokenMaxAgeSeconds,
  signSessionToken,
  shouldUseSecureCookie,
  verifyJwtToken,
} from "@/lib/jwt";

export type SessionSubject = {
  id: string;
  email: string;
  name: string | null;
};

function makeSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(subject: SessionSubject): Promise<{
  token: string;
  maxAge: number;
}> {
  const token = await signSessionToken({
    sub: subject.id,
    email: subject.email,
    name: subject.name,
  });

  const payload = await verifyJwtToken(token);
  const maxAge = getTokenMaxAgeSeconds(payload);
  if (maxAge <= 0) {
    throw new Error("Could not create session.");
  }

  await db.session.create({
    data: {
      id: token,
      userId: subject.id,
      expiresAt: new Date(Date.now() + maxAge * 1000),
    },
  });

  return { token, maxAge };
}

export function setSessionCookie(
  response: NextResponse,
  session: { token: string; maxAge: number },
) {
  response.cookies.set(
    AUTH_COOKIE_NAME,
    session.token,
    makeSessionCookieOptions(session.maxAge),
  );
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", makeSessionCookieOptions(0));
}
