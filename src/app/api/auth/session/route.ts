import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signInSchema } from "@/lib/validations";
import { AUTH_COOKIE_NAME, verifyJwtToken } from "@/lib/jwt";
import { clearSessionCookie, createSession, setSessionCookie } from "@/lib/session";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  failedLoginCount: number | null;
  lockedUntil: Date | null;
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

async function recordFailedLogin(userId: string, now: Date) {
  await db.$transaction(async (tx) => {
    const bumped = await tx.$executeRaw`
      UPDATE "User"
      SET "failedLoginCount" = COALESCE("failedLoginCount", 0) + 1
      WHERE "id" = ${userId}
        AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${now})
    `;

    if (bumped === 0) {
      return;
    }

    const snapshotRows = await tx.$queryRaw<
      Array<Pick<AuthUserRow, "failedLoginCount" | "lockedUntil">>
    >`
      SELECT "failedLoginCount", "lockedUntil"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;
    const snapshot = snapshotRows[0];

    if (!snapshot) {
      return;
    }

    if (snapshot.lockedUntil && snapshot.lockedUntil > now) {
      return;
    }

    if ((snapshot.failedLoginCount ?? 0) >= MAX_FAILED_ATTEMPTS) {
      await tx.$executeRaw`
        UPDATE "User"
        SET "failedLoginCount" = 0,
            "lockedUntil" = ${new Date(now.getTime() + LOCK_DURATION_MS)}
        WHERE "id" = ${userId}
      `;
    }
  });
}

async function findUserByEmailForAuth(email: string): Promise<AuthUserRow | null> {
  const rows = await db.$queryRaw<AuthUserRow[]>`
    SELECT "id", "email", "name", "emailVerifiedAt", "passwordHash", "failedLoginCount", "lockedUntil"
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

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const now = new Date();

  try {
    const user = await findUserByEmailForAuth(email);

    const isLocked = Boolean(user?.lockedUntil && user.lockedUntil > now);

    const hashToCheck = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCheck);
    
    if (!user || !user.passwordHash || isLocked || !passwordMatch) {
      if (user && !isLocked) {
        await recordFailedLogin(user.id, now);
      }

      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return Response.json(
        {
          error: "Email verification required.",
          code: "EMAIL_UNVERIFIED",
        },
        { status: 403 },
      );
    }

    await db.$executeRaw`
      UPDATE "User"
      SET "failedLoginCount" = 0,
          "lockedUntil" = NULL,
          "lastLoginAt" = ${now}
      WHERE "id" = ${user.id}
    `;

    const session = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, session);
    return response;
  } catch (err: unknown) {
    if (
      (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P1001") ||
      (typeof err === "object" && err !== null && err.constructor.name === "PrismaClientInitializationError")
    ) {
      return Response.json(
        { error: "Database холболт түр тасарсан байна. Дахин оролдоно уу." },
        { status: 503 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Session create failed:", err);
    }
    return Response.json({ error: "Could not create session." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  try {
    const payload = await verifyJwtToken(token);
    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!sub) {
      throw new Error("Invalid session subject.");
    }

    const rows = await db.$queryRaw<Array<{ email: string; passwordUpdatedAt: Date | null }>>`
      SELECT "email", "passwordUpdatedAt"
      FROM "User"
      WHERE "id" = ${sub}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      throw new Error("User not found.");
    }

    const issuedAt =
      typeof payload.iat === "number" && Number.isFinite(payload.iat)
        ? Math.floor(payload.iat)
        : null;

    if (
      issuedAt &&
      user.passwordUpdatedAt &&
      issuedAt < Math.floor(user.passwordUpdatedAt.getTime() / 1000)
    ) {
      throw new Error("Session is stale.");
    }

    return Response.json({
      authenticated: true,
      sub,
      email: user.email,
      exp: typeof payload.exp === "number" ? payload.exp : null,
    });
  } catch {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    clearSessionCookie(res);
    return res;
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}