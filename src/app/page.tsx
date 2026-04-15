import Link from "next/link";

const TRUST_PARTNERS = [
  "MOT CAPITAL",
  "MTS INTEGRATED",
  "ENCRYPTED_NODE",
  "OFFICIAL PARTNER",
];

const FEATURE_CARDS = [
  {
    title: "Auto-sync from MT5",
    copy:
      "Stop manual logging. A low-latency bridge captures entry, exit, and commission directly from your MT5 terminal.",
    chip: "LIVE PIPELINE",
    icon: "sync",
  },
  {
    title: "Mongolian UI",
    copy:
      "Native language support for labels, reports, and review prompts built for local traders.",
    chip: "MN-FIRST",
    icon: "language",
  },
  {
    title: "Quality Ratings",
    copy:
      "Each trade is scored by risk parameters, execution quality, and discipline signals.",
    chip: "REVIEW SCORE",
    icon: "rating",
  },
] as const;

const REVIEW_STEPS = ["Capture", "Tag", "Debrief", "Optimize"];
const CHART_BARS = [42, 66, 55, 88, 112, 81];

const BASIC_PLAN = [
  "Auto-sync from 2 MT5 accounts",
  "Monthly performance reports",
  "Native Mongolian UI",
];

const PLUS_PLAN = [
  "Weekly pro webinars (live)",
  "Unlimited MT5 account sync",
  "Advanced trade psyche analytics",
  "Priority institutional support",
];

function TopIcon(props: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.8)] text-[color:var(--color-txt-muted)] transition hover:text-[color:var(--color-txt-primary)]"
    >
      {props.children}
    </span>
  );
}

function FeatureIcon(props: { name: "sync" | "language" | "rating" }) {
  if (props.name === "sync") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M4 5h9m0 0-2.5-2.5M13 5 10.5 7.5M16 15H7m0 0 2.5 2.5M7 15l2.5-2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (props.name === "language") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M10 3v14M3 7h14M4.5 13.5A15 15 0 0 0 10 17a15 15 0 0 0 5.5-3.5M4.5 6.5A15 15 0 0 1 10 3a15 15 0 0 1 5.5 3.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="m10 3 2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13.8 5.8 16l.8-4.7L3.2 8l4.7-.7L10 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(133,170,255,0.2),transparent_38%),radial-gradient(circle_at_15%_50%,rgba(26,93,214,0.14),transparent_32%),radial-gradient(circle_at_85%_58%,rgba(42,122,255,0.14),transparent_30%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
        <header className="landing-reveal pt-5" style={{ animationDelay: "40ms" }}>
          <nav
            aria-label="Primary"
            className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-[rgba(11,14,17,0.65)] px-3 py-2 backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="tj-logo-box h-9 w-9 rounded-lg text-[13px]">NT</div>
            </div>

            <div className="hidden items-center gap-8 text-[11px] font-mono uppercase tracking-[0.18em] text-[color:var(--color-txt-muted)] md:flex">
              <a href="#preview" className="transition hover:text-[color:var(--color-txt-primary)]">
                Dashboard
              </a>
              <a href="#workflow" className="transition hover:text-[color:var(--color-txt-primary)]">
                Calendar
              </a>
              <a href="#pricing" className="transition hover:text-[color:var(--color-txt-primary)]">
                Reports
              </a>
            </div>

            <div className="flex items-center gap-2">
              <TopIcon>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M10 2.5A7.5 7.5 0 1 0 10 17.5 7.5 7.5 0 0 0 10 2.5Zm0 0c2.4 2.2 2.4 12.8 0 15m0-15c-2.4 2.2-2.4 12.8 0 15m-7.5-7.5h15"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TopIcon>
              <TopIcon>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M6 8a4 4 0 1 1 8 0v3l1.5 2H4.5L6 11V8Zm2.8 7h2.4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TopIcon>
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[linear-gradient(135deg,#2a7aff_0%,#7fa7ff_100%)] text-[13px] font-semibold text-white"
              >
                N
              </span>
            </div>
          </nav>
        </header>

        <section className="landing-reveal pt-14 text-center sm:pt-20" style={{ animationDelay: "120ms" }}>
          <div className="mx-auto max-w-4xl">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.9)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-txt-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-win)]" />
              Institutional grade terminals
            </p>

            <h1 className="mt-7 text-balance font-display text-[44px] font-semibold leading-[0.98] tracking-[-0.03em] text-[color:var(--color-txt-primary)] sm:text-[58px] lg:text-[76px]">
              Your edge is in the
              <br />
              review.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--color-txt-muted)] sm:text-lg">
              NOMAD Traders transforms raw MT5 data into institutional insights,
              built for the disciplined Mongolian trader who architects long-term success.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
              <Link
                href="/sign-up"
                className="btn-primary w-full max-w-[260px] rounded-lg px-5 py-3 text-sm sm:w-auto"
              >
                Connect MT5 for Free
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M4 10h12m0 0-4-4m4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <p className="inline-flex items-center gap-2 text-xs text-[color:var(--color-txt-muted)]">
                <svg viewBox="0 0 20 20" className="h-4 w-4 text-[color:var(--color-win)]" fill="none" aria-hidden="true">
                  <path
                    d="M10 3 4.5 5v4.2c0 3.2 2.2 6.1 5.5 7 3.3-.9 5.5-3.8 5.5-7V5L10 3Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Read-only access encryption
              </p>
            </div>
          </div>
        </section>

        <section
          id="preview"
          className="landing-reveal mt-12 rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(16,20,27,0.95)_0%,rgba(8,10,14,0.98)_100%)] p-3 shadow-[0_40px_120px_-55px_rgba(42,122,255,0.6)] sm:mt-14 sm:p-4"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="sr-only">Terminal preview</h2>
          <div className="mb-3 flex items-center justify-between border-b border-[color:var(--color-border)]/80 px-2 pb-3">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-loss)]/65" />
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-warn)]/65" />
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-win)]/65" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9eb0c7]">
              NOMAD Traders Terminal v2.4
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[170px_1fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-lg border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.92)] px-3 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-txt-dim)]">
                  Equity Growth
                </p>
                <p className="mt-2 font-mono text-[31px] font-semibold text-[color:var(--color-txt-primary)]">
                  +24.8%
                </p>
              </article>

              <article className="rounded-lg border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.92)] px-3 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-txt-dim)]">
                  Win Rate
                </p>
                <p className="mt-2 font-mono text-[31px] font-semibold text-[color:var(--color-win)]">
                  68.2%
                </p>
              </article>
            </div>

            <article className="rounded-lg border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.82)] p-3 sm:p-4">
              <div className="flex h-40 items-end gap-2 sm:h-48 sm:gap-3">
                {CHART_BARS.map((height, index) => (
                  <div
                    key={`${height}-${index}`}
                    className="chart-bar flex-1 rounded-md border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(148,168,225,0.9)_0%,rgba(89,104,141,0.6)_100%)]"
                    style={{
                      height,
                      animationDelay: `${200 + index * 80}ms`,
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="landing-reveal mt-7" style={{ animationDelay: "260ms" }}>
          <h2 className="sr-only">Trust signals</h2>
          <div className="flex flex-col gap-4 border-y border-[color:var(--color-border)] py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9eb0c7]">
              Trusted by institutional architects
            </p>

            <div className="grid grid-cols-2 gap-3 text-center sm:flex sm:items-center sm:gap-8">
              {TRUST_PARTNERS.map((name) => (
                <span
                  key={name}
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#b2bfd0]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="landing-reveal mt-14 rounded-2xl border border-[color:var(--color-border)] bg-[rgba(11,14,17,0.75)] p-5 sm:p-7"
          style={{ animationDelay: "320ms" }}
        >
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--color-txt-primary)] sm:text-4xl">
              Precision Engineering.
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-txt-dim)]">
              Engineered for the modern Mongolian market
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(18,22,28,0.96)_0%,rgba(12,15,20,0.94)_100%)] p-5"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-[rgba(26,32,48,0.9)] text-[color:var(--color-accent)]">
                  <FeatureIcon name={card.icon} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[color:var(--color-txt-primary)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-txt-muted)]">
                  {card.copy}
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-accent)]">
                  {card.chip}
                </p>
              </article>
            ))}
          </div>

          <article
            id="workflow"
            className="mt-4 grid gap-4 rounded-xl border border-[color:var(--color-border)] bg-[linear-gradient(90deg,rgba(18,22,28,0.95)_0%,rgba(14,17,22,0.95)_100%)] p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr]"
          >
            <div>
              <h3 className="text-2xl font-semibold text-[color:var(--color-txt-primary)]">
                Structured Review Flow
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--color-txt-muted)]">
                We do not just store trades. We guide your post-trade analysis so every
                loss and win maps to a repeatable blueprint.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
              {REVIEW_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`flex min-h-20 flex-col items-center justify-center rounded-md border border-[color:var(--color-border)] text-center text-xs font-mono uppercase tracking-[0.13em] ${
                    index === 2
                      ? "bg-[rgba(42,122,255,0.16)] text-[color:var(--color-accent)]"
                      : "bg-[rgba(8,10,14,0.8)] text-[color:var(--color-txt-muted)]"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section
          id="pricing"
          className="landing-reveal mt-14 rounded-2xl border border-[color:var(--color-border)] bg-[rgba(7,10,14,0.96)] p-6 sm:p-8"
          style={{ animationDelay: "380ms" }}
        >
          <div className="mb-7 text-center">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-[color:var(--color-txt-primary)] sm:text-5xl">
              Capital Allocation.
            </h2>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-txt-dim)]">
              Choose your tier of discipline
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-[color:var(--color-border)] bg-[rgba(18,22,28,0.9)] p-5 sm:p-6">
              <p className="font-mono text-sm uppercase tracking-[0.1em] text-[color:var(--color-txt-muted)]">
                Basic
              </p>
              <p className="mt-2 font-mono text-[42px] font-semibold leading-none text-[color:var(--color-txt-primary)]">
                $40<span className="text-sm text-[color:var(--color-txt-dim)]"> /cap</span>
              </p>

              <ul className="mt-5 space-y-3 text-sm text-[color:var(--color-txt-muted)]">
                {BASIC_PLAN.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[color:var(--color-win)]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="btn-ghost mt-8 w-full justify-center py-3">
                Initialize Basic
              </Link>
            </article>

            <article className="relative rounded-2xl border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,rgba(36,44,64,0.9)_0%,rgba(20,24,34,0.94)_100%)] p-5 shadow-[0_0_0_1px_rgba(42,122,255,0.2),0_30px_80px_-50px_rgba(42,122,255,0.9)] sm:p-6">
              <span className="absolute right-4 top-4 rounded-md border border-[color:var(--color-border)] bg-[rgba(160,188,255,0.2)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-txt-primary)]">
                Recommended
              </span>

              <p className="font-mono text-sm uppercase tracking-[0.1em] text-[color:var(--color-txt-muted)]">
                Plus
              </p>
              <p className="mt-2 font-mono text-[42px] font-semibold leading-none text-[color:var(--color-accent)]">
                $60<span className="text-sm text-[color:var(--color-txt-dim)]"> /cap</span>
              </p>

              <ul className="mt-5 space-y-3 text-sm text-[color:var(--color-txt-primary)]">
                {PLUS_PLAN.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="btn-primary mt-8 w-full justify-center py-3">
                Upgrade to Sovereign
              </Link>
            </article>
          </div>
        </section>

        <footer className="landing-reveal mt-14 border-t border-[color:var(--color-border)] pt-8 text-center" style={{ animationDelay: "430ms" }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-txt-muted)]">
            NOMAD Traders
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-[#a8b7ca] sm:gap-4">
            <Link className="rounded px-2 py-1 hover:text-[color:var(--color-txt-primary)]" href="/terms">Terms</Link>
            <Link className="rounded px-2 py-1 hover:text-[color:var(--color-txt-primary)]" href="/privacy">Privacy</Link>
            <Link className="rounded px-2 py-1 hover:text-[color:var(--color-txt-primary)]" href="/sign-in">Support</Link>
          </div>
          <p className="mt-3 pb-6 text-xs text-[#9eb0c7]">
            (c) 2026 NOMAD Traders. Disciplined architecture for the Mongolian trader.
          </p>
        </footer>
      </div>
    </main>
  );
}