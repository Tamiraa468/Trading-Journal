import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { consumeEmailCode } from "@/lib/auth-email-code";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";

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

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, code, newPassword } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash || !user.emailVerifiedAt) {
    return Response.json(
      { error: "Invalid reset code.", code: "INVALID_OR_EXPIRED_CODE" },
      { status: 400 },
    );
  }

  const codeResult = await consumeEmailCode({
    userId: user.id,
    purpose: "RESET_PASSWORD",
    code,
  });

  if (codeResult !== "ok") {
    return Response.json(
      { error: "Invalid reset code.", code: "INVALID_OR_EXPIRED_CODE" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordUpdatedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  return Response.json({ ok: true });
}
