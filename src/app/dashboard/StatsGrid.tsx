import type { TradeStats } from "@/lib/stats";
import { formatCurrency, formatSigned, pnlColor } from "@/lib/format";

type CardProps = {
  label: string;
  value: string;
  valueClass?: string;
  subtitle?: string;
  subtitleClass?: string;
};

function Card({ label, value, valueClass, subtitle, subtitleClass }: CardProps) {
  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <div className={`font-mono text-xl sm:text-2xl font-semibold ${valueClass ?? "text-txt-primary"}`}>
        {value}
      </div>
      {subtitle && (
        <div className={`mt-1 text-xs font-mono ${subtitleClass ?? "text-txt-muted"}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function StatsGrid({ stats }: { stats: TradeStats }) {
  const winRateClass =
    stats.totalTrades === 0
      ? "text-txt-muted"
      : stats.winRate >= 50
        ? "text-win"
        : "text-warn";

  const pfValue =
    stats.profitFactor === Infinity
      ? "∞"
      : stats.profitFactor === 0
        ? "—"
        : stats.profitFactor.toFixed(2);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Card
        label="Total P&L"
        value={formatSigned(stats.totalPnl)}
        valueClass={pnlColor(stats.totalPnl)}
        subtitle={`${stats.totalTrades} trades`}
      />
      <Card
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        valueClass={winRateClass}
        subtitle={`${stats.winCount}W / ${stats.lossCount}L`}
      />
      <Card
        label="Avg Win"
        value={formatCurrency(stats.avgWin)}
        valueClass="text-win"
      />
      <Card
        label="Avg Loss"
        value={formatCurrency(stats.avgLoss)}
        valueClass="text-loss"
      />
      <Card
        label="Profit Factor"
        value={pfValue}
        valueClass={
          stats.profitFactor >= 1 || stats.profitFactor === Infinity
            ? "text-win"
            : stats.profitFactor === 0
              ? "text-txt-muted"
              : "text-loss"
        }
      />
      <Card
        label="Best Trade"
        value={formatSigned(stats.bestTrade)}
        valueClass="text-win"
        subtitle={`Worst ${formatSigned(stats.worstTrade)}`}
        subtitleClass="text-loss"
      />
    </div>
  );
}
