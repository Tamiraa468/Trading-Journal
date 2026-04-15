import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="stat-card w-full">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-txt-dim)]">
          NOMAD Traders
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Terms</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--color-txt-muted)]">
          <p>
            By using NOMAD Traders, you agree to provide accurate account data and to use the
            platform only for lawful trading analysis activities.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of your credentials and for
            activity performed under your account.
          </p>
          <p>
            NOMAD Traders provides analytics tools only and does not provide financial advice,
            brokerage services, or execution guarantees.
          </p>
        </div>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          Back to landing
        </Link>
      </section>
    </main>
  );
}
