"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { SerializedTrade } from "./types";
import { formatCurrency, formatSigned, pnlColor } from "@/lib/format";

type Filter = "all" | "wins" | "losses";

export function TradeLog({ trades }: { trades: SerializedTrade[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "wins") return trades.filter((t) => t.pnl > 0);
    if (filter === "losses") return trades.filter((t) => t.pnl < 0);
    return trades;
  }, [trades, filter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete trade");
    } finally {
      setDeletingId(null);
    }
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: trades.length },
    { key: "wins", label: "Wins", count: trades.filter((t) => t.pnl > 0).length },
    { key: "losses", label: "Losses", count: trades.filter((t) => t.pnl < 0).length },
  ];

  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <span className="label">Trade Log</span>
          <div className="text-sm text-txt-muted">
            {filtered.length} of {trades.length} trades
          </div>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wide transition-colors ${
                filter === t.key
                  ? "bg-accent text-white"
                  : "text-txt-muted hover:text-txt-primary hover:bg-bg-hover"
              }`}
            >
              {t.label} <span className="opacity-60">({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-txt-muted font-mono">
          No trades to show.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <Th>Ticker</Th>
                <Th>Side</Th>
                <Th className="text-right">Entry</Th>
                <Th className="text-right">Exit</Th>
                <Th className="text-right">P&L</Th>
                <Th className="text-right">Qty</Th>
                <Th>Strategy</Th>
                <Th>Date</Th>
                <Th>Notes</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="trade-row">
                  <Td>
                    <span className="font-mono font-semibold tracking-tight">
                      {t.ticker}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono uppercase rounded ${
                        t.side === "LONG"
                          ? "bg-win/15 text-win"
                          : "bg-loss/15 text-loss"
                      }`}
                    >
                      {t.side}
                    </span>
                  </Td>
                  <Td className="text-right font-mono text-txt-muted">
                    ${t.entryPrice.toFixed(2)}
                  </Td>
                  <Td className="text-right font-mono text-txt-muted">
                    ${t.exitPrice.toFixed(2)}
                  </Td>
                  <Td className={`text-right font-mono font-semibold ${pnlColor(t.pnl)}`}>
                    {formatSigned(t.pnl)}
                  </Td>
                  <Td className="text-right font-mono text-txt-muted">
                    {t.quantity}
                  </Td>
                  <Td className="font-mono text-xs text-txt-muted">
                    {t.strategy ?? "—"}
                  </Td>
                  <Td className="font-mono text-xs text-txt-muted whitespace-nowrap">
                    {format(new Date(t.date), "MMM d, yyyy")}
                  </Td>
                  <Td className="max-w-xs truncate text-xs text-txt-muted">
                    {t.notes ?? ""}
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="text-xs text-txt-dim hover:text-loss transition-colors font-mono px-2 py-1"
                      title="Delete trade"
                    >
                      {deletingId === t.id ? "…" : "✕"}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-2 border-t border-border text-[10px] font-mono uppercase tracking-wider text-txt-dim flex justify-end gap-4">
        <span>
          Total{" "}
          <span className={pnlColor(filtered.reduce((s, t) => s + t.pnl, 0))}>
            {formatCurrency(filtered.reduce((s, t) => s + t.pnl, 0))}
          </span>
        </span>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-txt-muted border-b border-border bg-bg-card ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className ?? ""}`}>{children}</td>;
}
