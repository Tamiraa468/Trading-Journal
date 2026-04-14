import { NextRequest } from "next/server";
import {
  EmailCodeCooldownError,
  getEmailCodeTtlMinutes,
  issueEmailCode,
} from "@/lib/auth-email-code";
import { db } from "@/lib/db";
import { buildEmailVerificationTemplate } from "@/lib/email-templates";
import { sendTransactionalEmail } from "@/lib/mailer";
import { resendEmailCodeSchema } from "@/lib/validations";

const LOCAL_SUBJECT_PREFIX = "local_";

type ResendVerificationUserRow = {
  id: string;
  email: string;
  clerkId: string;
  emailVerifiedAt: Date | null;
};

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

  const parsed = resendEmailCodeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  const rows = await db.$queryRaw<ResendVerificationUserRow[]>`
    SELECT "id", "email", "clerkId", "emailVerifiedAt"
    FROM "User"
    WHERE "email" = ${email}
    LIMIT 1
  `;
  const user = rows[0] ?? null;

  if (
    !user ||
    !user.clerkId.startsWith(LOCAL_SUBJECT_PREFIX) ||
    user.emailVerifiedAt
  ) {
    return Response.json({ ok: true });
  }

  try {
    const issued = await issueEmailCode({
      userId: user.id,
      purpose: "VERIFY_EMAIL",
      enforceCooldown: true,
    });

    const template = buildEmailVerificationTemplate({
      code: issued.code,
      expiresMinutes: getEmailCodeTtlMinutes(),
    });

    await sendTransactionalEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (err) {
    if (err instanceof EmailCodeCooldownError) {
      return Response.json({ ok: true });
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Resend verification email failed:", err);
    }
  }

  return Response.json({ ok: true });
}
