# 💸 Vedly — Split expenses, not friendships

A full-stack Splitwise clone built with the latest Next.js 15, React 19, MongoDB 8, and Auth.js v5.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Database | MongoDB 8 via Mongoose 8 |
| Auth | Auth.js v5 (NextAuth) — Google OAuth |
| State | Zustand 5 |
| Charts | Recharts 2 |
| Forms | React Hook Form 7 + Zod 3 |
| Email | Resend 4 |
| Toast | react-hot-toast 2 |
| Dates | date-fns 4 |
| Currency | INR (₹) only |

## Features

### Core
- 🔐 **Google OAuth** — one-click sign in
- 👥 **Friends** — add by email, view balances, settle up
- 🏠 **Groups** — Home / Trip / Couple / Work / Other with emoji avatars
- 🧾 **Expenses** — full split engine (5 types: equal, exact, percent, shares, adjustment)
- 💸 **Settlements** — record payments with method (Cash / UPI / Bank Transfer)
- 📊 **Analytics** — 4 Recharts charts + CSV export

### Split Engine (5 Types)
1. **Equal** — divide total ÷ participants (remainder to first person)
2. **Exact** — enter exact amounts per person, validates sum = total
3. **Percent** — enter % per person, validates sum = 100%
4. **Shares** — enter share counts, auto-calculates proportional amounts
5. **Adjustment** — start from equal, allow +/- adjustments per person

### Groups
- Invite via unique 6-char code (`/join/[CODE]`)
- Simplify debts toggle (greedy graph algorithm)
- Admin controls: rename, toggle simplify, remove members, delete group
- Tabs: Expenses | Balances | Members

### Notifications
- Bell icon with unread count badge (polls every 30s)
- Mark individual / all read
- Email notifications via Resend (expense added, settlement received, group invite)

### Analytics
- Monthly spending bar chart (stacked by category)
- Category breakdown pie chart (current month)
- You paid vs You owe line chart (trend over time)
- Date range filters (1 month / 3 months / 6 months / all time)
- CSV export with all expense details

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd vedly
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
|----------|----------------|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → create free cluster → copy connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs → OAuth 2.0 |
| `AUTH_GOOGLE_SECRET` | Same as above |
| `RESEND_API_KEY` | [Resend.com](https://resend.com) → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev |

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID → Web application
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
vedly/
├── app/
│   ├── (auth)/login/          # Google sign-in page
│   ├── (dashboard)/           # Protected layout (sidebar + topbar)
│   │   ├── dashboard/         # Balance overview
│   │   ├── friends/           # Friend list + balances
│   │   ├── groups/            # Group list + detail
│   │   ├── expenses/new/      # Add expense (split engine)
│   │   ├── activity/          # Paginated activity feed
│   │   ├── analytics/         # Charts + CSV export
│   │   └── settings/          # Profile + notification prefs
│   ├── api/                   # REST API routes
│   └── join/[code]/           # Group invite handler
├── models/                    # Mongoose 8 schemas
├── lib/
│   ├── auth.ts                # Auth.js v5 config
│   ├── db.ts                  # MongoDB singleton
│   ├── balance.ts             # Balance engine + debt simplification
│   ├── email.ts               # Resend email templates
│   └── validations.ts         # Zod schemas
└── components/
    ├── layout/                # Sidebar, Topbar, BottomNav, UserAvatar
    ├── friends/               # FriendsClient
    ├── groups/                # GroupDetailClient
    ├── expenses/              # AddExpenseClient, SettleUpModal
    ├── analytics/             # AnalyticsClient (Recharts)
    ├── notifications/         # NotificationBell
    └── dashboard/             # ActivityClient, SettingsClient
```

## Balance Algorithm

The balance engine (`lib/balance.ts`) uses a **greedy creditor-debtor matching** algorithm to minimize transactions:

1. Calculate net balance for each person (total paid − total split)
2. Separate into creditors (positive balance) and debtors (negative)
3. Greedily match largest debtor to largest creditor
4. Repeat until all balanced

This is the same approach used by Splitwise to minimize the number of settlements needed.

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel deploy
```

Set all env variables in Vercel dashboard. Update Google OAuth redirect URI to your production URL.

### MongoDB Atlas

Use a free M0 cluster for development. Make sure to:
- Whitelist your IP (or `0.0.0.0/0` for Vercel)
- Create a database user
- Copy the connection string with your credentials

---

Built with ❤️ using Next.js 15, MongoDB 8, Auth.js v5, and Tailwind CSS v4.
