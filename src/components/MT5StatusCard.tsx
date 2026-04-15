"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = {
  connected: boolean;
  broker: string | null;
  login: string | null;
  lastSync: string | null;
  syncedTrades: number;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function MT5StatusCard() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/mt5/status", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => alive && setStatus(s));
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!status) {
    return (
      <Link
        href="/dashboard/settings"
        className="block rounded-xl border border-[var(--border)] bg-card p-4 text-sm text-[var(--txt-muted)]"
      >
        Loading MT5 status…
      </Link>
    );
  }

  const dot = status.connected ? "bg-win" : "bg-loss";
  const title = status.connected
    ? `Connected to ${status.broker ?? "MT5"}`
    : "MT5 disconnected";

  return (
    <Link
      href="/dashboard/settings"
      className="block rounded-xl border border-[var(--border)] bg-card p-4 hover:bg-[var(--bg-hover)] transition"
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="font-medium">{title}</div>
      </div>
      {status.connected ? (
        <div className="mt-2 text-sm text-[var(--txt-muted)]">
          Last sync {relativeTime(status.lastSync)} · {status.syncedTrades} trades
        </div>
      ) : (
        <div className="mt-2 text-sm text-[var(--txt-muted)]">
          Connect your broker to auto-log trades
        </div>
      )}
    </Link>
  );
}
