"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
    } finally {
      router.push("/sign-in");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-primary/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="tj-logo-box">NT</span>
            <span className="font-display font-semibold text-txt-primary">
              NOMAD Traders
            </span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent-glow text-accent border border-accent/40">
              PHASE 1
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-md text-txt-primary bg-bg-hover"
            >
              Dashboard
            </Link>
            <span
              title="Coming soon"
              className="px-3 py-1.5 rounded-md text-txt-dim cursor-not-allowed"
            >
              Календар
            </span>
            <span
              title="Coming soon"
              className="px-3 py-1.5 rounded-md text-txt-dim cursor-not-allowed"
            >
              Reports
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="btn-ghost"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
