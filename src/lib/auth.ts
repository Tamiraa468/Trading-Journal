import "server-only";

import { cookies, headers } from "next/headers";
import { db } from "./db";
import type { User } from "@prisma/client";
import {
  AUTH_COOKIE_NAME,
  extractBearerToken,
  verifyJwtToken,
} from "@/lib/jwt";

export type AuthClaims = {
  sub: string;
  email: string | null;
  name: string | null;
  issuedAt: number | null;
  token: string;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumericEpochSeconds(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.floor(value);
}

export async function getAuthClaims(): Promise<AuthClaims | null> {
  const h = await headers();
  const bearer = extractBearerToken(h.get("authorization"));

  const c = await cookies();
  const cookieToken = c.get(AUTH_COOKIE_NAME)?.value ?? null;

  const token = bearer ?? cookieToken;
  if (!token) return null;

  try {
    const payload = await verifyJwtToken(token);
    const sub = asNonEmptyString(payload.sub);
    if (!sub) return null;

    const email = asNonEmptyString(payload.email);
    const name = asNonEmptyString(payload.name);
    const issuedAt = asNumericEpochSeconds(payload.iat);

    return { sub, email, name, issuedAt, token };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const claims = await getAuthClaims();
  if (!claims) return null;

  const session = await db.session.findUnique({
    where: { id: claims.token },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: claims.sub },
  });

  if (!user) return null;

  const rows = await db.$queryRaw<Array<{ passwordUpdatedAt: Date | null }>>`
    SELECT "passwordUpdatedAt"
    FROM "User"
    WHERE "id" = ${claims.sub}
    LIMIT 1
  `;
  const passwordUpdatedAt = rows[0]?.passwordUpdatedAt ?? null;

  if (
    claims.issuedAt &&
    passwordUpdatedAt &&
    claims.issuedAt < Math.floor(passwordUpdatedAt.getTime() / 1000)
  ) {
    return null;
  }

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
