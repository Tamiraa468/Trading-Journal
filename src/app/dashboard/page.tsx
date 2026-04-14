import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStats } from "@/lib/stats";
import { Navbar } from "./Navbar";
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
    // Clerk not configured or DB unreachable — show demo data so the UI is still previewable.
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
  }));
  const stats = calculateStats(statsTrades);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {preview && (
        <div className="w-full bg-accent/10 border-b border-accent/30 text-center py-2 text-xs font-mono text-accent">
          Preview mode · showing demo data · configure Clerk + DATABASE_URL in .env to use live data
        </div>
      )}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6 flex-1">
        <DashboardHeader />
        <StatsGrid stats={stats} />
        <PnlChart trades={serialized} />
        <TradeLog trades={serialized} />
      </main>
    </div>
  );
}
