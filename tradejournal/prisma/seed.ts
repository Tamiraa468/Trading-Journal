import { PrismaClient, Side } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_CLERK_ID = "user_seed_demo";
const SAMPLE_EMAIL = "demo@tradejournal.local";

type SeedTrade = {
  ticker: string;
  side: Side;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  strategy: string;
  notes?: string;
  daysAgo: number;
};

const SEED_TRADES: SeedTrade[] = [
  { ticker: "AAPL", side: "LONG", entryPrice: 188.4, exitPrice: 192.15, quantity: 100, strategy: "Breakout", notes: "Clean break over prior day high.", daysAgo: 13 },
  { ticker: "TSLA", side: "SHORT", entryPrice: 244.7, exitPrice: 239.2, quantity: 50, strategy: "Reversal", notes: "Failed morning rally.", daysAgo: 11 },
  { ticker: "NVDA", side: "LONG", entryPrice: 876.2, exitPrice: 902.5, quantity: 25, strategy: "Momentum", notes: "Rode earnings gap continuation.", daysAgo: 9 },
  { ticker: "META", side: "LONG", entryPrice: 498.1, exitPrice: 495.4, quantity: 40, strategy: "Swing", notes: "Thesis broke, cut quick.", daysAgo: 8 },
  { ticker: "SPY", side: "SHORT", entryPrice: 521.5, exitPrice: 523.8, quantity: 100, strategy: "Scalp", notes: "Got stopped on VWAP reclaim.", daysAgo: 6 },
  { ticker: "AMD", side: "LONG", entryPrice: 164.3, exitPrice: 171.8, quantity: 75, strategy: "Gap Fill", notes: "Held overnight for full fill.", daysAgo: 4 },
  { ticker: "MSFT", side: "LONG", entryPrice: 418.6, exitPrice: 421.05, quantity: 50, strategy: "Breakout", notes: "Slow grinder, trailed stops.", daysAgo: 2 },
  { ticker: "AMZN", side: "SHORT", entryPrice: 186.2, exitPrice: 188.9, quantity: 60, strategy: "Reversal", notes: "Fade failed, small loss.", daysAgo: 1 },
];

function calcPnl(t: SeedTrade): number {
  const dir = t.side === "LONG" ? 1 : -1;
  return Math.round((t.exitPrice - t.entryPrice) * t.quantity * dir * 100) / 100;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkId: SAMPLE_CLERK_ID },
    update: {},
    create: {
      clerkId: SAMPLE_CLERK_ID,
      email: SAMPLE_EMAIL,
      name: "Demo Trader",
    },
  });

  await prisma.trade.deleteMany({ where: { userId: user.id } });

  const now = Date.now();
  const records = SEED_TRADES.map((t) => ({
    userId: user.id,
    ticker: t.ticker,
    side: t.side,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    quantity: t.quantity,
    strategy: t.strategy,
    notes: t.notes,
    pnl: calcPnl(t),
    date: new Date(now - t.daysAgo * 24 * 60 * 60 * 1000),
  }));

  await prisma.trade.createMany({ data: records });

  console.log(`Seeded ${records.length} trades for user ${user.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
