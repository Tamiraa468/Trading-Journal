import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStats } from "@/lib/stats";
import { StatsGrid } from "./StatsGrid";
import { PnlChart } from "./PnlChart";
import { TradeLog } from "./TradeLog";
import { DashboardHeader } from "./DashboardShell";
import type { SerializedTrade } from "./types";
import { buildMockTrades } from "./mockTrades";

export const dynamic = "force-dynamic";

async function loadTrades(): Promise<{
  serialized: SerializedTrade[];
  preview: boolean;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { serialized: buildMockTrades(), preview: true };

    const trades = await db.trade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 200,
    });

    return {
      serialized: trades.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        side: t.side,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        quantity: t.quantity,
        pnl: t.pnl,
        date: t.date.toISOString(),
        strategy: t.strategy,
        notes: t.notes,
      })),
      preview: false,
    };
  } catch {
    // Auth or DB is not ready — show demo data so the UI stays previewable.
    return { serialized: buildMockTrades(), preview: true };
  }
}

export default async function DashboardPage() {
  const { serialized, preview } = await loadTrades();
  const statsTrades = serialized.map((t) => ({
    ...t,
    date: new Date(t.date),
    userId: "preview",
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MANUAL" as const, // Add a default value for source
    mt5DealId: null, // Add a default value for mt5DealId
    swap: 0, // Add a default value for swap
    commission: 0, // Add a default value for commission
    reviewed: false, // Add a default value for reviewed
    magic: 0, // Add a default value for magic
  }));
  const stats = calculateStats(statsTrades);

  return (
    <>
      {preview && (
        <div className="w-full bg-accent/10 border-b border-accent/30 text-center py-2 text-xs font-mono text-accent">
          Preview mode · showing demo data · configure auth + DATABASE_URL in .env to use live data
        </div>
      )}
      <DashboardHeader />
      <StatsGrid stats={stats} />
      <PnlChart trades={serialized} />
      <TradeLog trades={serialized} />
    </>
  );
}
