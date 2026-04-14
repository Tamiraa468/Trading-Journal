import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EmailCodeCooldownError, issueEmailCode } from "@/lib/auth-email-code";
import { buildEmailVerificationTemplate } from "@/lib/email-templates";
import { sendTransactionalEmail } from "@/lib/mailer";
import { signUpSchema } from "@/lib/validations";

const LOCAL_SUBJECT_PREFIX = "local_";

type RegistrationUserRow = {
  id: string;
  email: string;
  name: string | null;
  clerkId: string;
  emailVerifiedAt: Date | null;
};

type MailTransportError = {
  code?: string;
  responseCode?: number;
  message?: string;
};

function isSmtpAuthError(err: unknown): boolean {
  const smtpErr = err as MailTransportError | null;
  const message = smtpErr?.message?.toLowerCase() ?? "";
  return (
    smtpErr?.code === "EAUTH" ||
    smtpErr?.responseCode === 535 ||
    message.includes("badcredentials") ||
    message.includes("invalid login") ||
    message.includes("username and password not accepted")
  );
}

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

async function findUserByEmailForRegister(
  email: string,
): Promise<RegistrationUserRow | null> {
  const rows = await db.$queryRaw<RegistrationUserRow[]>`
    SELECT "id", "email", "name", "clerkId", "emailVerifiedAt"
    FROM "User"
    WHERE "email" = ${email}
    LIMIT 1
  `;

  return rows[0] ?? null;
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

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, name } = parsed.data;

  try {
    const existing = await findUserByEmailForRegister(email);

    let user = existing;
    if (!user) {
      const created = await db.user.create({
        data: {
          clerkId: `${LOCAL_SUBJECT_PREFIX}${crypto.randomUUID()}`,
          email,
          name: name ?? null,
          passwordHash: null,
          emailVerifiedAt: null,
          failedLoginCount: 0,
          lockedUntil: null,
          passwordUpdatedAt: null,
        },
      });

      user = {
        id: created.id,
        email: created.email,
        name: created.name,
        clerkId: created.clerkId,
        emailVerifiedAt: null,
      };
    } else {
      const canRefreshPendingLocal =
        user.clerkId.startsWith(LOCAL_SUBJECT_PREFIX) &&
        !user.emailVerifiedAt;

      if (!canRefreshPendingLocal) {
        return Response.json({ error: "Could not create account." }, { status: 409 });
      }
    }

    const issued = await issueEmailCode({
      userId: user.id,
      purpose: "VERIFY_EMAIL",
      enforceCooldown: true,
    });

    const message = buildEmailVerificationTemplate({
      code: issued.code,
      expiresMinutes: issued.ttlMinutes,
    });

    await sendTransactionalEmail({
      to: user.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return NextResponse.json(
      {
        ok: true,
        verificationRequired: true,
        email: user.email,
      },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof EmailCodeCooldownError) {
      return NextResponse.json(
        {
          ok: true,
          verificationRequired: true,
          email,
        },
        { status: 202 },
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return Response.json({ error: "Could not create account." }, { status: 409 });
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
      return Response.json(
        {
          error:
            "Database холболт алдаатай байна. Түр хүлээгээд дахин оролдоно уу.",
        },
        { status: 503 },
      );
    }

    if (isSmtpAuthError(err)) {
      return Response.json(
        {
          error:
            "И-мэйл илгээх тохиргоо буруу байна. SMTP_PASS дээр Gmail App Password оруулна уу.",
        },
        { status: 503 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Register failed:", err);
    }
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
