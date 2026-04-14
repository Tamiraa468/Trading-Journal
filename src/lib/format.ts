export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}$${formatted}`;
}

export function formatSigned(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${formatted}`;
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-[color:var(--color-win)]";
  if (value < 0) return "text-[color:var(--color-loss)]";
  return "text-[color:var(--color-txt-muted)]";
}
