export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M12 20h9" />
          <path d="M12 4h9" />
          <path d="M4 12h16" />
          <path d="M6 4v16" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-txt-primary">Analytics</h1>
        <p className="mt-1 text-sm text-txt-muted font-mono">Coming soon</p>
      </div>
      <p className="text-sm text-txt-dim max-w-xs">
        Deep-dive analytics — performance by strategy, ticker, session, and time of day.
      </p>
    </div>
  );
}
