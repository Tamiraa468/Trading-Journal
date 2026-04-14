import Link from "next/link";

const FEATURES = [
  "P&L Dashboard",
  "Win Rate Analytics",
  "Strategy Tagging",
  "Trade Screenshots",
  "Profit Factor",
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="tj-logo-box text-base h-12 w-12 rounded-xl">
          <span className="text-lg">TJ</span>
        </div>

        <div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight">
            Trade<span className="text-[color:var(--color-accent)]">Journal</span>
          </h1>
          <p className="mt-5 text-lg text-[color:var(--color-txt-muted)] leading-relaxed">
            Log every trade. Track your P&amp;L. Analyze your strategy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href="/sign-up" className="btn-primary px-5 py-2.5 text-sm">
            Create account
          </Link>
          <Link href="/sign-in" className="btn-ghost px-5 py-2.5 text-sm">
            Sign in
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-xl">
          {FEATURES.map((f) => (
            <span key={f} className="pill">
              {f}
            </span>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-[color:var(--color-txt-dim)] font-mono">
        Phase 1 · TradeJournal
      </footer>
    </main>
  );
}
