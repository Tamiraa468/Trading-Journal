import crypto from "crypto";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST() {
  try {
    const user = await requireUser();

    const rl = rateLimit(`mt5:regen:${user.id}`, 5, 60_000);
    if (!rl.success) {
      return Response.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const syncToken = crypto.randomUUID();
    await db.user.update({
      where: { id: user.id },
      data: { syncToken },
    });

    return Response.json({ syncToken }, { headers: rateLimitHeaders(rl) });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("mt5/regenerate-token error");
    return new Response("Server error", { status: 500 });
  }
}
