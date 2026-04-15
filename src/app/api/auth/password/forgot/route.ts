import { NextRequest } from "next/server";
import {
  EmailCodeCooldownError,
  getEmailCodeTtlMinutes,
  issueEmailCode,
} from "@/lib/auth-email-code";
import { db } from "@/lib/db";
import { buildPasswordResetTemplate } from "@/lib/email-templates";
import { sendTransactionalEmail } from "@/lib/mailer";
import { forgotPasswordSchema } from "@/lib/validations";
import { authRateLimiter, getClientIp } from "@/lib/rate-limit";

type ForgotPasswordUserRow = {
  id: string;
  email: string;
  passwordHash: string | null;
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
  const ip = getClientIp(req);
  const rateLimit = await authRateLimiter.check(ip);
  if (!rateLimit.success) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // Add random delay to prevent timing attacks
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));

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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  try {
    const rows = await db.$queryRaw<ForgotPasswordUserRow[]>`
      SELECT "id", "email", "passwordHash", "emailVerifiedAt"
      FROM "User"
      WHERE "email" = ${email}
      LIMIT 1
    `;
    const user = rows[0] ?? null;
    if (!user || !user.passwordHash || !user.emailVerifiedAt) {
      return Response.json({ ok: true });
    }

    const issued = await issueEmailCode({
      userId: user.id,
      purpose: "RESET_PASSWORD",
      enforceCooldown: true,
    });

    const template = buildPasswordResetTemplate({
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

    // Handle database unavailability
    const isDbUnavailable =
      (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P1001") ||
      (typeof err === "object" && err !== null && err.constructor.name === "PrismaClientInitializationError");

    if (isDbUnavailable) {
      return Response.json(
        { error: "Database холболт түр тасарсан байна. Дахин оролдоно уу." },
        { status: 503 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Forgot-password email send failed:", err);
    }
    
    // Fallback response for unhandled errors
    return Response.json({ error: "Server error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
