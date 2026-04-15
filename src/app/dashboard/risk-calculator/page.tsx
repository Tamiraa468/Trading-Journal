export default function RiskCalculatorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-txt-primary">Risk Calculator</h1>
        <p className="mt-1 text-sm text-txt-muted font-mono">Coming soon</p>
      </div>
      <p className="text-sm text-txt-dim max-w-xs">
        Calculate position size, R:R ratio, and max drawdown before entering a trade.
      </p>
    </div>
  );
}
