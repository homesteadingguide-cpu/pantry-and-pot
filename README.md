# Pantry and Pot

**Your Kitchen Counter Journal** — a warm, journal-style manager for the apartment homestead: balcony crops, kitchen ferments (kombucha, sourdough, kraut, kefir), and the pantry on the shelf.

## Features

- **Dashboard** — today's routines, jars to check, low-stock alerts, ready-on-sill
- **Chores** — recurring tasks with categories (kitchen / balcony / pantry / brewing)
- **Plantings** — balcony pots, windowsill jars, grow-shelf trays
- **Cultures** — kombucha, sourdough, kraut, kefir, kimchi, vinegar with stage progression + "mark as fed"
- **Pantry** — jars, bags, bottles with low-stock alerts and +/- quantity buttons
- **Shopping** — auto-suggested from low-stock pantry items, with one-click restock
- **Live weather** — real-time temperature and conditions, set your location
- **Starter health chip** — shows time since your sourdough starter was last fed
- **Trial system** — 7-day free trial with email + passcode, then read-only until subscription

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma ORM with SQLite (dev) / Postgres (production)
- NextAuth.js for authentication
- TanStack Query for server state
- Open-Meteo + Nominatim for weather + geocoding

## Local Development

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the dev server
bun run dev
```

Open http://localhost:3000

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Pantry and Pot"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pantry-and-pot.git
git push -u origin main
```

### 2. Set Up a Database (Neon Postgres — free tier)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" → import your `pantry-and-pot` repo
3. Add these environment variables:
   - `DATABASE_URL` — your Neon connection string
   - `TRIAL_PASSCODE` — e.g. `PANTRYPOT` (share with trial users)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel URL (e.g. `https://pantry-and-pot.vercel.app`)
   - `PAYHIP_URL` — your Payhip product URL
   - `NEXT_PUBLIC_PAYHIP_URL` — same as above (needed for client-side)
4. Click "Deploy"
5. After deployment, run the database migration:
   - Go to Settings → Functions → and run `npx prisma db push` in the Vercel CLI, OR
   - Add a postbuild script: `prisma generate && prisma db push`

### 4. Switch Database Provider (Important!)

For production (Vercel + Postgres), change the Prisma datasource provider:

```prisma
datasource db {
  provider = "postgresql"  // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then run `bunx prisma db push` to create the tables in Postgres.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./db/custom.db` (dev) or `postgresql://...` (prod) |
| `TRIAL_PASSCODE` | Passcode for trial signup | `PANTRYPOT` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's URL | `http://localhost:3000` or `https://yourapp.vercel.app` |
| `PAYHIP_URL` | Your Payhip product URL | `https://payhip.com/your-product` |
| `NEXT_PUBLIC_PAYHIP_URL` | Same as PAYHIP_URL (client-side) | `https://payhip.com/your-product` |

## Trial System

- Visitors can browse the demo data without signing in
- Any mutation (add/edit/delete) triggers the "Start free trial" dialog
- Users enter email + passcode to start a 7-day trial
- After 7 days, mutations are blocked (read-only) until they subscribe via Payhip
- Each user gets their own private data (seeded with demo data on signup)

## License

All rights reserved.
