import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { createTradeSchema, calculatePnl } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = req.nextUrl;
    const filter = searchParams.get("filter");
    const strategy = searchParams.get("strategy");
    const ticker = searchParams.get("ticker");

    const where: Prisma.TradeWhereInput = { userId: user.id };
    if (filter === "wins") where.pnl = { gt: 0 };
    if (filter === "losses") where.pnl = { lt: 0 };
    if (strategy) where.strategy = strategy;
    if (ticker) where.ticker = ticker.toUpperCase();

    const trades = await db.trade.findMany({
      where,
      orderBy: { date: "desc" },
      take: 200,
    });

    return Response.json({ trades });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createTradeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const pnl = calculatePnl({
      side: data.side,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      quantity: data.quantity,
    });

    const trade = await db.trade.create({
      data: {
        userId: user.id,
        ticker: data.ticker,
        side: data.side,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        quantity: data.quantity,
        pnl,
        date: data.date,
        strategy: data.strategy ?? null,
        notes: data.notes ?? null,
      },
    });

    return Response.json({ trade }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
