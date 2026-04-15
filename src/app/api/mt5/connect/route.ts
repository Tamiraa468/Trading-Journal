import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { mt5ConnectSchema } from "@/lib/mt5-validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const rl = rateLimit(`mt5:connect:${user.id}`, 5, 60_000);
    if (!rl.success) {
      return Response.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = mt5ConnectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { login, server, password } = parsed.data;

    let encrypted: string;
    try {
      encrypted = encrypt(password);
    } catch {
      return new Response("Server error", { status: 500 });
    }

    const syncToken = crypto.randomUUID();

    await db.user.update({
      where: { id: user.id },
      data: {
        mt5Login: login,
        mt5Server: server,
        mt5InvestorPass: encrypted,
        syncToken,
        syncEnabled: true,
      },
    });

    return Response.json(
      { connected: true, syncToken },
      { status: 200, headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("mt5/connect error");
    return new Response("Server error", { status: 500 });
  }
}
