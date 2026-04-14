"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-bg-primary/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="tj-logo-box">TJ</span>
            <span className="font-display font-semibold text-txt-primary">
              TradeJournal
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
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
