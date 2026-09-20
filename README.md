<div align="center">

# 💸 SpendSmart (Rupeefy)

**A personal money-management app to track expenses, set budgets and hit savings goals.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-spend--smart--hazel.vercel.app-E8735A?style=for-the-badge&logo=vercel&logoColor=white)](https://spend-smart-hazel.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)
![React Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white)

</div>

---

## 🚀 Live Demo

**👉 [https://spend-smart-hazel.vercel.app](https://spend-smart-hazel.vercel.app)**

Create an account on the register page (email + password) or sign in with Google. The app is mobile-first and installable as a PWA, so it looks best in a phone-sized viewport (or with your browser's device toolbar turned on).

---

## 📖 About

SpendSmart (branded **Rupeefy** in the UI) helps you understand where your money goes. You log expenses in seconds, group them into categories, tag each one as a **Need, Want or Saving**, and watch the dashboard turn that data into insights: how much is left this month, whether you are on track, and how your spending compares with last week and last month.

It defaults to Indian Rupees (₹) and the `Asia/Kolkata` timezone, and is designed around the way people actually budget: a monthly budget, a daily spending limit, per-category limits, and goals you save towards.

---

## ✨ Features

### 📊 Dashboard
- Animated hero card showing money **remaining this month** against your monthly budget
- **Month forecast** projecting where your spending will land by month end
- **Smart insight** and weekly summary that update from your real data
- **Spending split** across Needs / Wants / Savings
- **Budget status**, **due-soon** recurring payments (next 7 days) and recent expenses at a glance

### 🧾 Expenses
- Add, edit and delete expenses with amount, date, merchant, note, category, type and tags
- 12 built-in categories (Food & Dining, Transport, Rent & Housing, Utilities, Entertainment, Shopping, Health & Fitness, Education, Travel, Personal Care, Savings, Others) plus custom categories
- Filter your expense history
- **Export to CSV**

### 🎯 Budgets
- Overall **monthly budget** and **daily spending limit**
- **Per-category limits** with colour-coded progress: green under 70%, amber from 70%, red from 90%, with a "limit exceeded" state
- **Budget history** so you can compare months

### 🐷 Savings Goals
- Create goals with a target amount, emoji, colour and optional deadline
- Add funds manually, with progress and time-remaining shown on each card
- **Auto-allocate**: the monthly budget surplus is distributed across goals that have auto-allocate switched on. Goals with closer deadlines get a higher weight (3× within 90 days, 2× within 180 days), and no goal receives more than it still needs
- **Saving streak** tracker to build the habit

### 🔁 Recurring Expenses
- Daily, weekly, monthly or yearly rules for rent, subscriptions, EMIs and similar
- Processing **catches up on missed periods**, creating one expense per period that was missed while you were away

### 📈 Reports
- **Daily**, **weekly** and **monthly** reports
- This week vs last week, month over month, category changes, top spend days and daily breakdown
- Income vs expenses and spending forecast

### 🔐 Auth & Security
- Email/password sign-up with **bcrypt** hashing
- **Google OAuth** sign-in with a one-time `state` value stored in Redis to prevent CSRF
- Short-lived **JWT access tokens (15 min)** and **rotating refresh tokens (7 days)** in an httpOnly cookie, with refresh-token IDs tracked in Redis
- Route protection through Next.js **middleware**: every `/api/*` route requires a valid Bearer token
- Login flow supports **TOTP two-factor codes** on the backend

### 🎨 Experience
- Mobile-first layout with a bottom navigation bar
- **Light and dark mode**
- Animated splash screen and count-up numbers powered by **GSAP**
- Installable **PWA** (web app manifest and icons)

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 14](https://nextjs.org) (App Router) + React 18 |
| Language | TypeScript |
| Database | PostgreSQL via [Prisma ORM](https://www.prisma.io) |
| Server state | [TanStack Query](https://tanstack.com/query) |
| Client state | [Zustand](https://zustand-demo.pmnd.rs) |
| Forms | React Hook Form |
| Auth | JWT ([jose](https://github.com/panva/jose)), bcryptjs, Google OAuth 2.0, otpauth (TOTP) |
| Cache / sessions | [Upstash Redis](https://upstash.com) |
| File storage | AWS S3 (presigned URLs, for receipt uploads) |
| Animation | [GSAP](https://gsap.com) |
| Hosting | [Vercel](https://vercel.com) |

---

## 🗂️ Project Structure

```
spendsmart-app/
├── app/
│   ├── (auth)/            # login, register, OAuth callback
│   ├── (app)/             # dashboard, expenses, budgets, goals, recurring, reports, settings
│   └── api/               # REST route handlers
│       ├── auth/          #   login, register, refresh, logout, me, google
│       ├── expenses/      #   CRUD + CSV export
│       ├── budgets/       #   CRUD + history
│       ├── goals/         #   CRUD, add funds, auto-allocate, streak
│       ├── recurring/     #   CRUD + process due rules
│       ├── reports/       #   daily, weekly, monthly
│       ├── categories/  alerts/  dashboard/  receipts/  user/
├── components/            # UI kit, charts, modals, navigation
├── hooks/                 # React Query hooks (useExpenses, useBudgets, ...)
├── lib/                   # auth (jwt, password), prisma, redis, goal allocation, utils
├── stores/                # Zustand stores (auth, UI)
├── prisma/                # schema.prisma + seed.ts
├── types/                 # shared TypeScript types
├── public/                # PWA manifest and icons
└── middleware.ts          # auth guard for pages and API routes
```

### Data model

`User` → `Expense`, `Category`, `Budget`, `Goal`, `RecurringRule`, `Alert`

Expenses are typed as `Needs | Wants | Savings`, and recurring rules and budgets support `DAILY | WEEKLY | MONTHLY | YEARLY` periods. See [prisma/schema.prisma](prisma/schema.prisma) for the full schema.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Railway, Neon, Supabase or local)
- An [Upstash Redis](https://upstash.com) database (free tier is enough)
- *(Optional)* Google OAuth credentials and an AWS S3 bucket

### 1. Clone and install

```bash
git clone https://github.com/Peiush/SpendSmart.git
cd SpendSmart
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct (non-pooled) connection string, used by Prisma for migrations |
| `ACCESS_TOKEN_SECRET` | Secret for access JWTs (`openssl rand -base64 32`) |
| `REFRESH_TOKEN_SECRET` | Secret for refresh JWTs (use a different value) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (for Google sign-in) |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app, e.g. `http://localhost:3000` |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | S3 credentials (optional, for receipts) |

> **Note:** `.env.example` does not yet list `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` or `NEXT_PUBLIC_APP_URL`. Add them to your `.env.local` yourself.

For Google sign-in, add `http://localhost:3000/api/auth/google/callback` as an authorised redirect URI in your Google Cloud console.

### 3. Set up the database

```bash
npx prisma db push      # create the tables
npx prisma db seed      # seed the 12 default categories
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Run the production build |
| `npm run lint` | Lint the project |

---

## ☁️ Deployment

The app is deployed on **Vercel**. To deploy your own copy:

1. Import the repository into Vercel.
2. Add the environment variables above in the project settings, with `NEXT_PUBLIC_APP_URL` set to your production URL.
3. Add `https://<your-domain>/api/auth/google/callback` to your Google OAuth redirect URIs.
4. Deploy. `npm run build` runs `prisma generate` automatically.

---

## 🗺️ Roadmap

- [ ] Import expenses from CSV (upload currently previews the row count only)
- [ ] Two-factor authentication setup screen (TOTP login is supported by the API)
- [ ] Receipt photo upload to S3 from the add-expense form
- [ ] Budget threshold alerts and notifications
- [ ] Rate limiting on auth endpoints

---

## 🤝 Contributing

Issues and pull requests are welcome. Fork the repo, create a feature branch, and open a PR.

## 👤 Author

**Piyush Saini**: [@Peiush](https://github.com/Peiush)

---

<div align="center">

If you found this project useful, consider giving it a ⭐

</div>
