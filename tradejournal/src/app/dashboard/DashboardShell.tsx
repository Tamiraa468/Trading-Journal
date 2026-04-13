"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TradeForm } from "./TradeForm";

export function DashboardHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <div className="mt-1 text-sm text-txt-muted font-mono">
            {format(new Date(), "EEEE, MMM d, yyyy")}
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={open ? "btn-ghost" : "btn-primary"}
        >
          {open ? "Close" : "+ Log trade"}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          <TradeForm onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
