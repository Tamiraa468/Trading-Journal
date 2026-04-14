# TradeJournal

A dark, fast trading journal. Log every trade, track your P&L, and analyze your strategy.

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** (CSS-first theme via `@theme`)
- **Clerk** (`@clerk/nextjs`, `@clerk/themes`) — authentication
- **Prisma 6** + **PostgreSQL**
- **Recharts** — P&L bar chart
- **Zod** — request validation
- **date-fns** — date formatting
- **svix** — Clerk webhook verification

## Project Structure

```
tradejournal/
├── middleware.ts                       # Clerk middleware protecting /dashboard(.*)
├── prisma/
│   ├── schema.prisma                   # User, Trade, Screenshot models
│   └── seed.ts                         # 8 sample trades
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # ClerkProvider + fonts
│   │   ├── page.tsx                    # Landing
│   │   ├── globals.css                 # Tailwind v4 theme + components
│   │   ├── sign-in/[[...sign-in]]/     # Clerk SignIn
│   │   ├── sign-up/[[...sign-up]]/     # Clerk SignUp
│   │   ├── api/
│   │   │   ├── trades/route.ts         # GET list, POST create
│   │   │   ├── trades/[id]/route.ts    # GET / PATCH / DELETE
│   │   │   └── webhooks/clerk/route.ts # User sync via svix
│   │   └── dashboard/
│   │       ├── page.tsx                # Server page — data + stats
│   │       ├── Navbar.tsx              # Nav + UserButton
│   │       ├── DashboardShell.tsx      # Header + form toggle
│   │       ├── StatsGrid.tsx           # 6 stat cards
│   │       ├── PnlChart.tsx            # Recharts bar chart (14d)
│   │       ├── TradeForm.tsx           # + Log trade form
│   │       ├── TradeLog.tsx            # Filterable trade table
│   │       └── types.ts                # SerializedTrade
│   └── lib/
│       ├── db.ts                       # Prisma singleton
│       ├── auth.ts                     # getCurrentUser / requireUser
│       ├── validations.ts              # Zod schemas + STRATEGIES
│       ├── stats.ts                    # calculateStats
│       └── format.ts                   # $ / color helpers
└── .env.example
```

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally, or a free [Neon](https://neon.tech) database
- A free [Clerk](https://clerk.com) account

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Then edit `.env`:

- Create an app in the [Clerk Dashboard](https://dashboard.clerk.com) and copy the **publishable** and **secret** keys.
- For the webhook, create an endpoint in Clerk pointing to `https://<your-tunnel>/api/webhooks/clerk` (use `ngrok` or similar in dev), subscribe it to `user.created` / `user.updated` / `user.deleted`, and paste the signing secret.
- `DATABASE_URL` — local Postgres URL or a Neon connection string.

### 4. Database

```bash
npx prisma migrate dev --name init   # create tables
npm run db:seed                      # optional: insert 8 sample trades
```

The seed uses a placeholder `clerkId` (`user_seed_demo`). After you sign in through Clerk the first time, your real user is synced by the webhook (or lazily by `getCurrentUser()` on first dashboard load), and you can start logging real trades.

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000> — the landing page redirects to `/dashboard` once you're signed in.

## Scripts

| Command              | What it does                         |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start Next.js dev server (Turbopack) |
| `npm run build`      | Production build                     |
| `npm run start`      | Start built app                      |
| `npm run lint`       | ESLint                               |
| `npm run db:migrate` | `prisma migrate dev`                 |
| `npm run db:push`    | Sync schema without a migration      |
| `npm run db:seed`    | Insert sample trades                 |
| `npm run db:studio`  | Open Prisma Studio                   |

## Theme

Trading-terminal dark palette (exposed as Tailwind tokens via `@theme` in `globals.css`):

| Token         | Hex       |
| ------------- | --------- |
| `bg-primary`  | `#0b0e11` |
| `bg-card`     | `#12161c` |
| `bg-input`    | `#181d25` |
| `bg-hover`    | `#1a2030` |
| `border`      | `#1e2738` |
| `accent`      | `#2a7aff` |
| `win`         | `#00d68f` |
| `loss`        | `#ff4757` |
| `warn`        | `#ffbe0b` |
| `txt-primary` | `#e4e8ef` |
| `txt-muted`   | `#6b7a90` |
| `txt-dim`     | `#3d4a5c` |

Fonts: **Outfit** for display, **JetBrains Mono** for numbers and code.

## API Reference

| Method | Route                     | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/api/trades`             | List user trades (query: filter, strategy, ticker) |
| POST   | `/api/trades`             | Create trade (auto-calculates P&L)   |
| GET    | `/api/trades/[id]`        | Get single trade + screenshots       |
| PATCH  | `/api/trades/[id]`        | Update trade                         |
| DELETE | `/api/trades/[id]`        | Delete trade                         |
| POST   | `/api/webhooks/clerk`     | Clerk webhook — syncs users          |

All `/api/trades*` routes require auth (401 otherwise).

## Phase 1 scope

Shipped: auth, CRUD for trades, stats, daily P&L chart, filterable trade log, dark theme, seed data.

Not yet: calendar view, reports, screenshot uploads (schema is ready), multi-currency, tags beyond strategy.
