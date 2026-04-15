export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-txt-primary">Reports</h1>
        <p className="mt-1 text-sm text-txt-muted font-mono">Coming soon</p>
      </div>
      <p className="text-sm text-txt-dim max-w-xs">
        Weekly and monthly performance reports — P&amp;L breakdowns, win rate trends, and exportable summaries.
      </p>
    </div>
  );
}
