export type SerializedTrade = {
  id: string;
  ticker: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  date: string;
  strategy: string | null;
  notes: string | null;
};
