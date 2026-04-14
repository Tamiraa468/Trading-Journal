"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import type { SerializedTrade } from "./types";

type DayBucket = { day: string; label: string; pnl: number };

function aggregate(trades: SerializedTrade[], days = 14): DayBucket[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    buckets.set(format(d, "yyyy-MM-dd"), 0);
  }
  for (const t of trades) {
    const key = format(startOfDay(new Date(t.date)), "yyyy-MM-dd");
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + t.pnl);
    }
  }
  return Array.from(buckets.entries()).map(([day, pnl]) => ({
    day,
    label: format(new Date(day), "MMM d"),
    pnl: Math.round(pnl * 100) / 100,
  }));
}

type TooltipPayload = { value: number; payload: DayBucket };
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = d.pnl >= 0 ? "var(--color-win)" : "var(--color-loss)";
  const sign = d.pnl >= 0 ? "+" : "";
  return (
    <div
      className="rounded-md border border-border bg-bg-card px-3 py-2 text-xs font-mono shadow-lg"
      style={{ minWidth: 120 }}
    >
      <div className="text-txt-muted">{d.label}</div>
      <div style={{ color }} className="mt-0.5 text-sm font-semibold">
        {sign}${d.pnl.toFixed(2)}
      </div>
    </div>
  );
}

export function PnlChart({ trades }: { trades: SerializedTrade[] }) {
  const data = aggregate(trades, 14);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="label">Daily P&L</span>
          <div className="text-sm text-txt-muted">Last 14 days</div>
        </div>
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#1e2738" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7a90", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "#1e2738" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7a90", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "#1e2738" }}
              tickLine={false}
              width={60}
              tickFormatter={(v: number) => `$${v}`}
            />
            <ReferenceLine y={0} stroke="#2a3450" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: "rgba(42,122,255,0.06)" }}
              content={<ChartTooltip />}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.day}
                  fill={d.pnl >= 0 ? "var(--color-win)" : "var(--color-loss)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
