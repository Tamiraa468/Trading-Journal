# TradeJournal

A dark, fast trading journal. Log every trade, track your P&L, and analyze your strategy.

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** (CSS-first theme via `@theme`)
- **JWT (HttpOnly session cookie)** — authentication
- **Prisma 6** + **PostgreSQL**
- **Recharts** — P&L bar chart
- **Zod** — request validation
- **date-fns** — date formatting
- **jose** — JWT verification
- **bcryptjs** — password hashing/verification
- **nodemailer** — verification/reset emails

## Project Structure

```
tradejournal/
├── proxy.ts                            # Route guard for /dashboard and /api/trades
├── prisma/
│   ├── schema.prisma                   # User, Trade, Screenshot models
│   └── seed.ts                         # 8 sample trades
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout + fonts
│   │   ├── page.tsx                    # Landing
│   │   ├── globals.css                 # Tailwind v4 theme + components
│   │   ├── sign-in/[[...sign-in]]/     # Email/password sign-in form
│   │   ├── sign-in/forgot-password/     # Password reset flow (6-digit code)
│   │   ├── sign-up/[[...sign-up]]/     # Account registration form
│   │   ├── sign-up/verify/              # Email verification (6-digit code)
│   │   ├── api/
│   │   │   ├── auth/register/route.ts  # Register user + send verification code
│   │   │   ├── auth/session/route.ts   # Login/logout/session cookie
│   │   │   ├── auth/google/route.ts    # Google OAuth start (state + nonce + PKCE)
│   │   │   ├── auth/google/callback/route.ts # Google OAuth callback + session issue
│   │   │   ├── auth/verify-email/route.ts # Verify signup email code + start session
│   │   │   ├── auth/verify-email/resend/route.ts # Resend email verification code
│   │   │   ├── auth/password/forgot/route.ts # Send password reset code
│   │   │   ├── auth/password/reset/route.ts # Reset password with 6-digit code
│   │   │   ├── trades/route.ts         # GET list, POST create
│   │   │   ├── trades/[id]/route.ts    # GET / PATCH / DELETE
│   │   └── dashboard/
│   │       ├── page.tsx                # Server page — data + stats
│   │       ├── Navbar.tsx              # Nav + sign out
│   │       ├── DashboardShell.tsx      # Header + form toggle
│   │       ├── StatsGrid.tsx           # 6 stat cards
│   │       ├── PnlChart.tsx            # Recharts bar chart (14d)
│   │       ├── TradeForm.tsx           # + Log trade form
│   │       ├── TradeLog.tsx            # Filterable trade table
│   │       └── types.ts                # SerializedTrade
│   └── lib/
│       ├── db.ts                       # Prisma singleton
│       ├── auth.ts                     # JWT claims + getCurrentUser / requireUser
│       ├── jwt.ts                      # Token verification and cookie policy
│       ├── session.ts                  # Shared session issuance + cookie helpers
│       ├── google-oauth.ts             # Google OAuth/JWK verification helpers
│       ├── auth-email-code.ts          # One-time 6-digit code issue/consume logic
│       ├── mailer.ts                   # Nodemailer sender
│       ├── email-templates.ts          # Dark TradeJournal HTML email templates
│       ├── validations.ts              # Zod schemas + STRATEGIES
│       ├── stats.ts                    # calculateStats
│       └── format.ts                   # $ / color helpers
└── .env
```

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally, or a free [Neon](https://neon.tech) database

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Set these variables in `.env`:

- `DATABASE_URL` — local Postgres URL or a Neon connection string.
- `JWT_SECRET` — secret used to verify signed JWTs.
- `GOOGLE_CLIENT_ID` — Google OAuth client id.
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret.
- `APP_BASE_URL` — production base URL (example: `https://your-app.com`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — Nodemailer SMTP settings.
- Optional: `SMTP_SECURE` (`true/false`, default port-based).
- Optional: `EMAIL_CODE_SECRET` — HMAC secret for hashing 6-digit codes (falls back to `JWT_SECRET`).
- Optional: `EMAIL_CODE_TTL_MINUTES`, `EMAIL_CODE_RESEND_COOLDOWN_SECONDS`, `EMAIL_CODE_MAX_ATTEMPTS`.
- Optional: `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ALLOWED_ALGORITHMS` (comma-separated).
- Optional: `JWT_EXPIRES_IN_SECONDS` (session хугацаа, default 43200 sec).
- Optional: `SEED_USER_PASSWORD` (seed demo хэрэглэгчийн password override).

Auth flow:

- User sign-up/sign-in хийхэд сервер JWT session үүсгээд `tj_session` HttpOnly cookie-д хадгална.
- API client хэрэглэх бол `Authorization: Bearer <token>` header-оор мөн ажиллана.
- Local sign-up дээр эхлээд 6 оронтой код майлээр баталгаажуулсны дараа session үүснэ.
- Forgot password урсгал 6 оронтой reset code-г майлээр илгээж шинэ нууц үг тохируулна.
- Google OAuth flow нь state + nonce + PKCE ашиглана, callback дээр Google ID token JWK-ээр баталгаажуулна.
- Production орчинд `APP_BASE_URL` заавал тохируулж callback URL spoofing эрсдэлийг багасгана.

### 4. Database

```bash
npx prisma migrate dev --name init   # create tables
npm run db:seed                      # optional: insert 8 sample trades
```

Seed нь demo хэрэглэгч үүсгэнэ:

- Email: `demo@tradejournal.local`
- Password: `DemoPass123!` (эсвэл `SEED_USER_PASSWORD`)

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000> and sign up/sign in with email + password.

Local auth pages:

- `/sign-up` -> create account, then verify email with 6-digit code
- `/sign-up/verify` -> enter verification code (or resend)
- `/sign-in/forgot-password` -> request/reset password using 6-digit code

Google OAuth callback URL:

- `http://localhost:3000/api/auth/google/callback` (development)
- `https://<your-domain>/api/auth/google/callback` (production)

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
| POST   | `/api/auth/register`      | Create user (email/password) + send verification code |
| POST   | `/api/auth/session`       | Login (email/password) + set `tj_session` cookie |
| GET    | `/api/auth/session`       | Check current authenticated session  |
| DELETE | `/api/auth/session`       | Clear auth session cookie            |
| GET    | `/api/auth/google`        | Start Google OAuth (state + nonce + PKCE) |
| GET    | `/api/auth/google/callback` | Verify Google token, create session, redirect |
| POST   | `/api/auth/verify-email`  | Verify signup email code + start session |
| POST   | `/api/auth/verify-email/resend` | Resend signup verification code |
| POST   | `/api/auth/password/forgot` | Send password reset code (generic response) |
| POST   | `/api/auth/password/reset` | Reset password with 6-digit code |
| GET    | `/api/trades`             | List user trades (query: filter, strategy, ticker) |
| POST   | `/api/trades`             | Create trade (auto-calculates P&L)   |
| GET    | `/api/trades/[id]`        | Get single trade + screenshots       |
| PATCH  | `/api/trades/[id]`        | Update trade                         |
| DELETE | `/api/trades/[id]`        | Delete trade                         |

All `/api/trades*` routes require auth (401 otherwise).

## Phase 1 scope

Shipped: auth, CRUD for trades, stats, daily P&L chart, filterable trade log, dark theme, seed data.

Not yet: calendar view, reports, screenshot uploads (schema is ready), multi-currency, tags beyond strategy.
