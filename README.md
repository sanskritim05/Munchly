# Munchly

Hot or Not for food photos. Post your meal, get rated, share your score card.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (auth, Postgres, storage, realtime)
- Groq API (`llama-3.3-70b-versatile`) for profile taste picks only
- Framer Motion swipe gestures
- Deploy on Vercel (free tier)

## Setup

1. **Clone & install**

   ```bash
   npm install
   ```

2. **Supabase project**

   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL Editor
   - Run `supabase/onboarding-migration.sql` if upgrading an existing database
   - Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous
   - Create a **public** storage bucket named `plates`

3. **Environment variables**

   Copy `.env.example` → `.env` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY` (free, no credit card — [console.groq.com](https://console.groq.com); powers taste picks only)

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signin` | Sign in |
| `/signup` | Create account |
| `/onboard` | Profile setup (username, photo, bio) |
| `/swipe` | TikTok-style rating feed |
| `/post` | Upload a plate |
| `/plate/[id]` | Plate detail + live score |
| `/profile/[username]` | User profile grid |
| `/leaderboard` | Weekly hot list |
| `/share/[id]` | Viral share card + OG image |

## Deploy

Push to GitHub and import on Vercel. Add the same env vars. The weekly leaderboard cron runs Mondays at midnight UTC via `vercel.json`.
