"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { STRATEGIES } from "@/lib/validations";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Side = "LONG" | "SHORT";

export function TradeForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [side, setSide] = useState<Side>("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [date, setDate] = useState<string>(todayISO());
  const [strategy, setStrategy] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewPnl = useMemo(() => {
    const e = parseFloat(entryPrice);
    const x = parseFloat(exitPrice);
    const q = parseInt(quantity || "0", 10);
    if (!isFinite(e) || !isFinite(x) || !isFinite(q) || q <= 0) return null;
    const dir = side === "LONG" ? 1 : -1;
    return Math.round((x - e) * q * dir * 100) / 100;
  }, [entryPrice, exitPrice, quantity, side]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          side,
          entryPrice,
          exitPrice,
          quantity,
          date,
          strategy: strategy || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.issues?.formErrors?.[0] ??
          Object.values(body?.issues?.fieldErrors ?? {})
            .flat()
            .filter(Boolean)[0] ??
          body?.error ??
          `Request failed (${res.status})`;
        throw new Error(typeof msg === "string" ? msg : "Request failed");
      }
      setTicker("");
      setEntryPrice("");
      setExitPrice("");
      setQuantity("100");
      setStrategy("");
      setNotes("");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const pnlColorClass =
    previewPnl === null
      ? "text-txt-muted"
      : previewPnl > 0
        ? "text-win"
        : previewPnl < 0
          ? "text-loss"
          : "text-txt-muted";

  return (
    <form
      onSubmit={handleSubmit}
      className="stat-card animate-slide-in space-y-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="label">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            required
            maxLength={10}
            className="input-field"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="label">Side</label>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setSide("LONG")}
              className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${
                side === "LONG"
                  ? "bg-win/20 text-win"
                  : "bg-bg-input text-txt-muted hover:text-txt-primary"
              }`}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setSide("SHORT")}
              className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${
                side === "SHORT"
                  ? "bg-loss/20 text-loss"
                  : "bg-bg-input text-txt-muted hover:text-txt-primary"
              }`}
            >
              Short
            </button>
          </div>
        </div>

        <div>
          <label className="label">Entry</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Exit</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder="0.00"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Shares</label>
          <input
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="input-field"
          >
            <option value="">—</option>
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why did you take this trade?"
            maxLength={500}
            className="input-field"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="font-mono text-sm">
          <span className="label mr-2 inline">Preview P&L</span>
          <span className={`font-semibold ${pnlColorClass}`}>
            {previewPnl === null
              ? "—"
              : `${previewPnl > 0 ? "+" : previewPnl < 0 ? "-" : ""}$${Math.abs(previewPnl).toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-loss font-mono mr-2">{error}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs"
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={submitting}>
            {submitting ? "Saving…" : "Save trade"}
          </button>
        </div>
      </div>
    </form>
  );
}
