import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export type EmailCodePurpose = "VERIFY_EMAIL" | "RESET_PASSWORD";

const DEFAULT_CODE_TTL_MINUTES = 10;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 5;

export class EmailCodeCooldownError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Code resend cooldown active.");
    this.name = "EmailCodeCooldownError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getCodeSecret(): string {
  const secret =
    process.env.EMAIL_CODE_SECRET?.trim() || process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing EMAIL_CODE_SECRET or JWT_SECRET environment variable.");
  }

  return secret;
}

function getCodeTtlMinutes(): number {
  return Math.min(
    Math.max(getPositiveIntEnv("EMAIL_CODE_TTL_MINUTES", DEFAULT_CODE_TTL_MINUTES), 5),
    30,
  );
}

function getResendCooldownSeconds(): number {
  return Math.min(
    Math.max(
      getPositiveIntEnv(
        "EMAIL_CODE_RESEND_COOLDOWN_SECONDS",
        DEFAULT_RESEND_COOLDOWN_SECONDS,
      ),
      20,
    ),
    300,
  );
}

function getMaxAttempts(): number {
  return Math.min(
    Math.max(getPositiveIntEnv("EMAIL_CODE_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS), 3),
    10,
  );
}

function hashCode(userId: string, purpose: EmailCodePurpose, code: string): string {
  return createHmac("sha256", getCodeSecret())
    .update(`${purpose}:${userId}:${code}`)
    .digest("hex");
}

function secureHashCompare(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function getEmailCodeTtlMinutes(): number {
  return getCodeTtlMinutes();
}

export type IssueEmailCodeResult = {
  code: string;
  expiresAt: Date;
  ttlMinutes: number;
  resendAfterSeconds: number;
};

export async function issueEmailCode(args: {
  userId: string;
  purpose: EmailCodePurpose;
  enforceCooldown?: boolean;
}): Promise<IssueEmailCodeResult> {
  const now = new Date();
  const ttlMinutes = getCodeTtlMinutes();
  const resendAfterSeconds = getResendCooldownSeconds();
  const maxAttempts = getMaxAttempts();

  const existing = await db.emailCode.findUnique({
    where: {
      userId_purpose: {
        userId: args.userId,
        purpose: args.purpose,
      },
    },
  });

  if (args.enforceCooldown !== false && existing?.resendNotBefore && existing.resendNotBefore > now) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resendNotBefore.getTime() - now.getTime()) / 1000),
    );
    throw new EmailCodeCooldownError(retryAfterSeconds);
  }

  const code = generateSixDigitCode();
  const codeHash = hashCode(args.userId, args.purpose, code);
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const resendNotBefore = new Date(now.getTime() + resendAfterSeconds * 1000);

  await db.emailCode.upsert({
    where: {
      userId_purpose: {
        userId: args.userId,
        purpose: args.purpose,
      },
    },
    create: {
      userId: args.userId,
      purpose: args.purpose,
      codeHash,
      expiresAt,
      resendNotBefore,
      attemptsLeft: maxAttempts,
      sentCount: 1,
      consumedAt: null,
    },
    update: {
      codeHash,
      expiresAt,
      resendNotBefore,
      attemptsLeft: maxAttempts,
      consumedAt: null,
      sentCount: { increment: 1 },
    },
  });

  return {
    code,
    expiresAt,
    ttlMinutes,
    resendAfterSeconds,
  };
}

export type ConsumeEmailCodeStatus =
  | "ok"
  | "not_found"
  | "expired"
  | "invalid"
  | "attempts_exhausted";

export async function consumeEmailCode(args: {
  userId: string;
  purpose: EmailCodePurpose;
  code: string;
}): Promise<ConsumeEmailCodeStatus> {
  const now = new Date();

  return db.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        codeHash: string;
        expiresAt: Date;
        attemptsLeft: number;
        consumedAt: Date | null;
      }>
    >`
      SELECT "id", "codeHash", "expiresAt", "attemptsLeft", "consumedAt"
      FROM "EmailCode"
      WHERE "userId" = ${args.userId}
        AND "purpose" = CAST(${args.purpose} AS "EmailCodePurpose")
      LIMIT 1
      FOR UPDATE
    `;

    const record = lockedRows[0];

    if (!record || record.consumedAt) {
      return "not_found";
    }

    if (record.expiresAt <= now) {
      await tx.emailCode.update({
        where: { id: record.id },
        data: { consumedAt: now },
      });
      return "expired";
    }

    if (record.attemptsLeft <= 0) {
      return "attempts_exhausted";
    }

    const incomingHash = hashCode(args.userId, args.purpose, args.code);
    const matched = secureHashCompare(record.codeHash, incomingHash);

    if (!matched) {
      const updated = await tx.emailCode.update({
        where: { id: record.id },
        data: {
          attemptsLeft: {
            decrement: 1,
          },
        },
      });

      if ((updated.attemptsLeft ?? 0) <= 0) {
        return "attempts_exhausted";
      }

      return "invalid";
    }

    await tx.emailCode.update({
      where: { id: record.id },
      data: {
        consumedAt: now,
        attemptsLeft: 0,
      },
    });

    return "ok";
  });
}
