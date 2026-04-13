import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { updateTradeSchema, calculatePnl } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const trade = await db.trade.findFirst({
      where: { id, userId: user.id },
      include: { screenshots: true },
    });
    if (!trade) return new Response("Not found", { status: 404 });
    return Response.json({ trade });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.trade.findFirst({ where: { id, userId: user.id } });
    if (!existing) return new Response("Not found", { status: 404 });

    const body = await req.json();
    const parsed = updateTradeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const patch = parsed.data;
    const next = {
      ticker: patch.ticker ?? existing.ticker,
      side: patch.side ?? existing.side,
      entryPrice: patch.entryPrice ?? existing.entryPrice,
      exitPrice: patch.exitPrice ?? existing.exitPrice,
      quantity: patch.quantity ?? existing.quantity,
      date: patch.date ?? existing.date,
      strategy: patch.strategy ?? existing.strategy,
      notes: patch.notes ?? existing.notes,
    };
    const pnl = calculatePnl({
      side: next.side,
      entryPrice: next.entryPrice,
      exitPrice: next.exitPrice,
      quantity: next.quantity,
    });

    const trade = await db.trade.update({
      where: { id },
      data: { ...next, pnl },
    });
    return Response.json({ trade });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await db.trade.findFirst({ where: { id, userId: user.id } });
    if (!existing) return new Response("Not found", { status: 404 });
    await db.trade.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
