export default function JournalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-txt-primary">Journal</h1>
        <p className="mt-1 text-sm text-txt-muted font-mono">Coming soon</p>
      </div>
      <p className="text-sm text-txt-dim max-w-xs">
        View your trades on a calendar heatmap — spot your best and worst trading days at a glance.
      </p>
    </div>
  );
}
