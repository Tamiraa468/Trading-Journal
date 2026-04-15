"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  broker: string | null;
  login: string | null;
  lastSync: string | null;
  syncedTrades: number;
  syncToken: string | null;
};

const BROKERS = [
  { label: "MOT Capital", server: "MOTCapital-Live" },
  { label: "IC Markets", server: "ICMarketsSC-Live" },
  { label: "XM", server: "XMGlobal-Real" },
  { label: "Exness", server: "Exness-Real" },
  { label: "Custom", server: "" },
];

async function fetchStatus(): Promise<Status | null> {
  const r = await fetch("/api/mt5/status", { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export default function MT5ConnectForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [brokerIdx, setBrokerIdx] = useState(0);
  const [customServer, setCustomServer] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus().then(setStatus);
  }, []);

  const broker = BROKERS[brokerIdx];
  const server = broker.server || customServer;

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, server, password }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErr(data.error ?? "Connection failed");
        return;
      }
      setPassword("");
      const s = await fetchStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      const r = await fetch("/api/mt5/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmDelete: true }),
      });
      if (r.ok) {
        setConfirmingDisconnect(false);
        const s = await fetchStatus();
        setStatus(s);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setLoading(true);
    try {
      const r = await fetch("/api/mt5/regenerate-token", { method: "POST" });
      if (r.ok) {
        const s = await fetchStatus();
        setStatus(s);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyToken(tok: string) {
    await navigator.clipboard.writeText(tok);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (status?.connected) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-win" />
          <div>
            <div className="font-medium">Connected to {status.broker}</div>
            <div className="text-sm text-[var(--txt-muted)]">
              Login {status.login} · {status.syncedTrades} synced trades ·{" "}
              {status.lastSync
                ? `last sync ${new Date(status.lastSync).toLocaleString()}`
                : "awaiting first sync"}
            </div>
          </div>
        </div>

        {status.syncToken && (
          <div className="rounded-lg bg-[var(--bg-input)] p-3 space-y-2">
            <div className="text-xs text-[var(--txt-muted)]">Sync token (paste into your EA)</div>
            <div className="flex gap-2">
              <code className="flex-1 font-mono text-xs break-all">{status.syncToken}</code>
              <button
                onClick={() => copyToken(status.syncToken!)}
                className="text-xs px-2 py-1 rounded bg-accent text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
          >
            Regenerate token
          </button>
          {confirmingDisconnect ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-loss text-white text-sm"
              >
                Confirm disconnect
              </button>
              <button
                onClick={() => setConfirmingDisconnect(false)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDisconnect(true)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-loss"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleConnect}
      autoComplete="off"
      className="rounded-xl border border-[var(--border)] bg-card p-6 space-y-4"
    >
      <div>
        <div className="text-lg font-medium">Connect MetaTrader 5</div>
        <div className="text-sm text-[var(--txt-muted)]">
          Use your <strong>investor (read-only)</strong> password. We can never place trades.
        </div>
      </div>

      <label className="block">
        <span className="text-sm">Broker</span>
        <select
          value={brokerIdx}
          onChange={(e) => setBrokerIdx(Number(e.target.value))}
          className="mt-1 w-full rounded-lg bg-[var(--bg-input)] px-3 py-2"
        >
          {BROKERS.map((b, i) => (
            <option key={b.label} value={i}>
              {b.label}
              {b.server ? ` (${b.server})` : ""}
            </option>
          ))}
        </select>
      </label>

      {broker.label === "Custom" && (
        <label className="block">
          <span className="text-sm">Server</span>
          <input
            type="text"
            value={customServer}
            onChange={(e) => setCustomServer(e.target.value)}
            pattern="[a-zA-Z0-9\-]+"
            required
            className="mt-1 w-full rounded-lg bg-[var(--bg-input)] px-3 py-2 font-mono text-sm"
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm">MT5 login</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4,12}"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          className="mt-1 w-full rounded-lg bg-[var(--bg-input)] px-3 py-2 font-mono"
        />
      </label>

      <label className="block">
        <span className="text-sm flex items-center gap-2">
          Investor password
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
            AES-256 encrypted
          </span>
        </span>
        <div className="relative mt-1">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            required
            minLength={4}
            maxLength={64}
            className="w-full rounded-lg bg-[var(--bg-input)] px-3 py-2 pr-16 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--txt-muted)]"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {err && <div className="text-sm text-loss">{err}</div>}

      <button
        type="submit"
        disabled={loading || !login || !password || !server}
        className="w-full rounded-lg bg-accent text-white py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Connecting…" : "Connect"}
      </button>

      <div className="text-xs text-[var(--txt-muted)] flex items-center justify-between">
        <span>Read-only investor password — we can never place trades</span>
        <a href="/downloads/TradeJournalSync.ex5" className="text-accent hover:underline">
          Download EA
        </a>
      </div>
    </form>
  );
}
