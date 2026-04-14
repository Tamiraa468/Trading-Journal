import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeEmailCode } from "@/lib/auth-email-code";
import { db } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/session";
import { verifyEmailCodeSchema } from "@/lib/validations";

const LOCAL_SUBJECT_PREFIX = "local_";

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return false;
  }

  try {
    return origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Bad request: JSON body is required." },
      { status: 400 },
    );
  }

  const parsed = verifyEmailCodeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, code, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.clerkId.startsWith(LOCAL_SUBJECT_PREFIX)) {
    return Response.json(
      { error: "Invalid verification code.", code: "INVALID_OR_EXPIRED_CODE" },
      { status: 400 },
    );
  }

  if (user.emailVerifiedAt) {
    return Response.json(
      { error: "Email is already verified.", code: "ALREADY_VERIFIED" },
      { status: 409 },
    );
  }

  const result = await consumeEmailCode({
    userId: user.id,
    purpose: "VERIFY_EMAIL",
    code,
  });

  if (result !== "ok") {
    return Response.json(
      { error: "Invalid verification code.", code: "INVALID_OR_EXPIRED_CODE" },
      { status: 400 },
    );
  }

  const now = new Date();
  const verifiedUser = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: now,
      failedLoginCount: 0,
      lockedUntil: null,
      passwordUpdatedAt: now,
    },
  });

  try {
    const session = await createSession({
      id: verifiedUser.id,
      email: verifiedUser.email,
      name: verifiedUser.name,
    });

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, session);
    return response;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Email verification session create failed:", err);
    }
    return Response.json({ error: "Could not create session." }, { status: 500 });
  }
}
