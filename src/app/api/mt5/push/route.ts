import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { mt5PushSchema } from "@/lib/mt5-validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const SYNC_SECRET = process.env.MT5_SYNC_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = mt5PushSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { token, userId: bodyUserId, deal } = parsed.data;

    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    let userId: string | null = null;
    let rateKey: string;

    if (bearer && SYNC_SECRET && bearer === SYNC_SECRET && bodyUserId) {
      userId = bodyUserId;
      rateKey = `mt5:push:secret:${bodyUserId}`;
    } else if (token) {
      const u = await db.user.findUnique({
        where: { syncToken: token },
        select: { id: true, syncEnabled: true },
      });
      if (!u || !u.syncEnabled) {
        return new Response("Unauthorized", { status: 401 });
      }
      userId = u.id;
      rateKey = `mt5:push:${token}`;
    } else {
      return new Response("Unauthorized", { status: 401 });
    }

    const rl = rateLimit(rateKey, 120, 60_000);
    if (!rl.success) {
      return Response.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    if (bearer && bodyUserId) {
      const exists = await db.user.findUnique({
        where: { id: userId! },
        select: { id: true },
      });
      if (!exists) return new Response("Unauthorized", { status: 401 });
    }

    const pnl = Math.round((deal.profit + deal.swap + deal.commission) * 100) / 100;
    const quantity = Math.max(1, Math.round(deal.volume * 100));
    const ticker = deal.symbol.slice(0, 20);
    const date = new Date(deal.time * 1000);

    const trade = await db.trade.upsert({
      where: { mt5DealId: deal.ticket },
      create: {
        userId: userId!,
        ticker,
        side: deal.side,
        entryPrice: deal.entryPrice,
        exitPrice: deal.exitPrice,
        quantity,
        pnl,
        date,
        source: "MT5_SYNC",
        mt5DealId: deal.ticket,
        swap: deal.swap,
        commission: deal.commission,
        magic: deal.magic,
        reviewed: false,
      },
      update: {},
      select: { id: true, createdAt: true, updatedAt: true },
    });

    await db.user.update({
      where: { id: userId! },
      data: { lastSyncAt: new Date() },
    });

    const created = trade.createdAt.getTime() === trade.updatedAt.getTime();
    return Response.json(
      { ok: true, dedup: !created, tradeId: trade.id },
      { status: created ? 201 : 200, headers: rateLimitHeaders(rl) },
    );
  } catch (err) {
    console.error("mt5/push error");
    return new Response("Server error", { status: 500 });
  }
}
