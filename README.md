# Survivor Golf ⛳

Prize money pick optimizer for your golf survivor league.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally (optional)
```bash
npm run dev
```
Open http://localhost:5173

> Note: the `/api/datagolf` proxy only works after deploying to Vercel. For local testing, see the note below.

---

## Deploy to Vercel

### Step 1 — Push to GitHub
1. Create a new repo on github.com (call it `survivor-golf`)
2. In this folder, run:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/survivor-golf.git
git push -u origin main
```

### Step 2 — Connect to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New Project**
3. Import your `survivor-golf` repo
4. Leave all settings as default — Vercel auto-detects Vite
5. Click **Deploy**

### Step 3 — Add your DataGolf API key
1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `DATAGOLF_API_KEY`
   - **Value:** your DataGolf API key
3. Click **Save**
4. Go to **Deployments** and click **Redeploy** (so the env variable takes effect)

### Step 4 — Share the link
Vercel gives you a public URL like `survivor-golf-xyz.vercel.app`. Share that with your league — anyone can open it in a browser, no account needed.

---

## How it works

- **This week tab:** Pulls live DataGolf pre-tournament predictions and ranks available players by expected prize money. Elite players (top 25 DG ranking) get an opportunity cost penalty in non-elevated weeks.
- **My picks tab:** Add every player you've already used this season. Picks are saved to your browser's localStorage, so they persist across sessions on the same device.
- **Opponent tab:** Log your opponent's picks to see differentiation. Burned players are flagged in this week's recommendations.

## Scoring model

Expected prize = Σ (finish probability × prize amount for that finish)

Finish probabilities come directly from DataGolf's pre-tournament model (baseline + course history + fit).

Opportunity cost penalty: elite players (DG rank ≤ 25) get a 28% score reduction in standard/opposite-field events, encouraging you to save them for majors and elevated events.

Differentiation bonus/penalty: players your opponent has already burned get a small score penalty; players they haven't used get a small bonus.
