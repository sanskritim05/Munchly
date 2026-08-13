# Munchly

**Is your food a 10?**

Munchly is Hot or Not for food photos. Snap a plate, share it, and find out how people really rate your meal — on a simple 0–10 score built from **Hot** and **Not** votes.

Post it. Rate it. Find out.

---

## What it does

### Rate plates
Swipe or tap through a feed of food photos. **Hot** if you’d eat it. **Not** if you’d pass. Keep a daily rating streak by rating plates regularly.

### Post your meal
Upload a photo, tag the restaurant and what you ordered, then put your plate in front of the community. Votes update your score live.

### Scores that mean something
Each plate gets a **0–10 score** from the mix of Hot vs Not votes (not just raw Hot count). Browse **Top** to see the all-time highest rated plates.

### Follow people & explore
Switch between everyone and people you follow. Search for users, comment on plates, and check profiles with grids of their meals and average scores.

### Taste picks
Get personalized dish and restaurant suggestions based on what you’ve posted and rated — useful when you’re hungry and don’t know what to order next.

### Share the flex
Every plate has a shareable score card (with OG image) so you can drop a “is this a 10?” link anywhere.

### Install as an app
Munchly is a Progressive Web App — add it to your home screen and use it like a native phone app.

---

## How scoring works (quick version)

- **Plate score** = share of Hot votes out of all votes, scaled to 0–10.
- **Leaderboard ranking** balances that score with how many votes a plate has, so a few lucky Votes don’t automatically beat a well-rated meal with more opinions.
- The Top list ranks plates all-time by score and vote volume.

---

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (auth, Postgres, storage, realtime)
- Groq API for taste picks
- Framer Motion for swipe gestures
- Deployed on Vercel

---

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL Editor
   - Run remaining migrations in `supabase/` as needed
   - Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous
   - Create a **public** storage bucket named `plates`

3. **Environment**

   Copy `.env.example` → `.env` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY` ([console.groq.com](https://console.groq.com) — taste picks only)

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## Main routes

| Route | What it’s for |
|-------|----------------|
| `/` | Landing |
| `/get-started` / `/signin` | Create account or sign in |
| `/swipe` | Rate + Explore feeds |
| `/post` | Upload a plate |
| `/plate/[id]` | Plate detail, comments, live score |
| `/leaderboard` | All-time Top plates |
| `/picks` | Personalized taste picks |
| `/profile/[username]` | Someone’s plates and stats |
| `/share/[id]` | Shareable score card |

---

## Deploy

Push to GitHub and import on Vercel. Add the same env vars. The weekly leaderboard refresh can run via the configured cron in `vercel.json`.
