import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="stat-card w-full">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-txt-dim)]">
          NOMAD Traders
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Privacy</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[color:var(--color-txt-muted)]">
          <p>
            NOMAD Traders stores account profile, performance metrics, and journal notes needed to
            deliver reporting and review workflows.
          </p>
          <p>
            Sensitive credentials are never displayed in plain text, and session access is protected
            with secure cookie settings and verification controls.
          </p>
          <p>
            You can request account deletion at any time, and all associated user data will be
            removed according to platform retention rules.
          </p>
        </div>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          Back to landing
        </Link>
      </section>
    </main>
  );
}
