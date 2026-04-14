import type { Trade } from "@prisma/client";

export type TradeStats = {
  totalPnl: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
};

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalPnl: 0,
      winCount: 0,
      lossCount: 0,
      totalTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      bestTrade: 0,
      worstTrade: 0,
      currentStreak: 0,
    };
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const avgWin = wins.length
    ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
    : 0;
  const profitFactor = avgLoss === 0 ? (avgWin > 0 ? Infinity : 0) : Math.abs(avgWin / avgLoss);
  const best = Math.max(...trades.map((t) => t.pnl));
  const worst = Math.min(...trades.map((t) => t.pnl));

  const sorted = [...trades].sort((a, b) => b.date.getTime() - a.date.getTime());
  let currentStreak = 0;
  if (sorted.length > 0) {
    const firstSign = Math.sign(sorted[0].pnl);
    if (firstSign !== 0) {
      for (const t of sorted) {
        if (Math.sign(t.pnl) === firstSign) {
          currentStreak += firstSign;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalPnl: r2(totalPnl),
    winCount: wins.length,
    lossCount: losses.length,
    totalTrades: trades.length,
    winRate: r2((wins.length / trades.length) * 100),
    avgWin: r2(avgWin),
    avgLoss: r2(avgLoss),
    profitFactor: Number.isFinite(profitFactor) ? r2(profitFactor) : profitFactor,
    bestTrade: r2(best),
    worstTrade: r2(worst),
    currentStreak,
  };
}
