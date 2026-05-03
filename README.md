# Survivor Golf

A pick optimizer for golf survivor pools — recommends who to pick each week based on expected prize money, with an opportunity cost penalty that discourages burning elite players on low-stakes events.

**Live app:** [survivor-golf.vercel.app](https://survivor-golf.vercel.app)

---

## Overview

In a golf survivor pool, you pick one player each week. If they miss the cut, you're eliminated. You can't reuse players across the season.

Most players pick by gut — take a highly ranked player at a big event and hope for the best. This tool frames the decision as an **expected value + resource allocation problem**: every elite player you use this week is one fewer bullet for a major next month.

The app pulls live DataGolf pre-tournament predictions, calculates each available player's expected prize money, applies an opportunity cost penalty for elite players in low-purse events, and returns a ranked recommendation list with plain-language explanations for each pick.

---

## Research Question

**When should you deploy your elite players?**

Two forces pull in opposite directions:

1. **Current-week EV** — expected prize money this week, based on win/top-5/top-10/make-cut probabilities × actual PGA Tour payout structure
2. **Future opportunity cost** — the projected value of saving that player for an upcoming major or elevated event ($20M+ purse)

Using raw win probability alone doesn't capture this trade-off. A player ranked #2 in the world at a $9M standard event might drop to your 4th-best recommendation once their value at the Masters — two weeks away — enters the calculation.

---

## Why It Matters

Survivor pools are a resource allocation problem under uncertainty. The difference between winning a season-long pool and busting out in week 14 often comes down to a single pick decision: did you deploy a top-5 player in a throwaway event, or hold them for a premium spot?

This framing applies directly to how sports organizations think about roster construction, lineup decisions, and in-season asset management — making the most of limited high-upside resources across a constrained set of opportunities.

---

## Data Sources

All predictions come from the [DataGolf API](https://datagolf.com/api-access):

| Endpoint | Usage |
|---|---|
| Pre-tournament predictions | Win %, top 5%, top 10%, top 20%, make cut % per player |
| World rankings | DataGolf's own skill-based rankings (distinct from OWGR) |
| Tournament schedule | Upcoming events, used to project future opportunity cost |
| Player list | Full tour player pool for pick-entry search |

Purse data is hardcoded from public PGA Tour announcements and updated each season. Prize share percentages are calibrated to observed PGA Tour payout distributions.

---

## Methodology

### Expected Prize Calculation

For each available player (not yet used by the picker):

```
Expected Prize = win_prob          × (purse × 0.180)
              + (top5  − win)      × (purse × 0.055)
              + (top10 − top5)     × (purse × 0.028)
              + (top20 − top10)    × (purse × 0.014)
              + (cut   − top20)    × (purse × 0.004)
```

Prize shares reflect PGA Tour structure: 18% to the winner, scaling down through top-20 and make-cut positions. Making the cut has positive expected value, which matters late in the season when deep picks are scarce.

### Opportunity Cost Penalty

Elite players receive a downward score adjustment based on their projected EV at the best upcoming major or elevated event on the remaining schedule.

**Top-5 players (DG rank ≤ 5) — dynamic penalty:**
- Current EV ≥ 120% of best future EV → no penalty (clearly worth it this week)
- Current EV 90–120% of future EV → soft penalty (10–20%), scaled by event type
- Current EV < 90% of future EV → hard penalty (22–38%) — model flags "Save for [event name]"

**Elite players (DG rank 6–25):**
- Standard events: flat 25% penalty
- Majors or elevated events ($20M+ purse): no penalty

The penalty structure means a top-3 player at a $9M standard event, with a major in two weeks, might rank below a lower-rated player with no future upside protection.

### Sit-Out Detection

If no available player clears `purse × 0.008` in adjusted EV — roughly $72K at a $9M event — the model flags a potential sit-out week. This is most relevant late in the season when strong options have been exhausted.

---

## Key Findings

Running the model across a typical PGA Tour season surfaces a few consistent patterns:

- **Elite players are systematically overdeployed** in standard events early in the season. When a top-5 player's current-week EV is less than 90% of their projected major EV, using them costs roughly 22–38% of their adjusted value — a trade most pickers make without realizing it.
- **The sit-out threshold fires infrequently** (~2–3 times per season in typical scenarios), but when it does, it correctly identifies weeks where no available player offers meaningful expected return relative to purse.
- **Opportunity cost penalties invert the recommendation** — moving a player from first to fourth or lower — in roughly 30–40% of weeks during the pre-major stretch of the schedule (April, May, June).
- **Making the cut has real value late in the season.** A player with a 60% cut probability and modest top-20 upside often outranks a boom-or-bust pick once available top-25 players have been used.

---

## Limitations

- **Predictions are static pre-tournament** — no live score updates; a player who withdraws Thursday morning won't be flagged until the next data refresh
- **Picks are localStorage-only** — no cross-device sync; clearing browser storage loses the season's pick history
- **Purse map is hardcoded** — needs a manual update each season as PGA Tour announces changes to elevated event schedules
- **Opportunity cost multipliers are manually calibrated** — the EV tiers and penalty coefficients are grounded in observed PGA Tour payout structure but have not been fit to historical survivor pool outcome data
- **Field strength not independently modeled** — the model relies entirely on DataGolf's probabilities to reflect field quality; a top-25 player in a weak field vs. a stacked field isn't separately penalized

---

## How to Run

**Prerequisites:** Node.js 18+, a DataGolf API key ([free tier](https://datagolf.com/api-access) works), Vercel account for deployment.

```bash
npm install
npm run dev        # Local dev — note: API proxy requires Vercel deployment
```

**Deploy to Vercel** (required for API proxy and CORS handling):

1. Push to GitHub, import repo in Vercel → deploy (auto-detects Vite)
2. Add environment variable: `DATAGOLF_API_KEY=<your_key>`
3. Redeploy — the Vercel serverless function at `/api/datagolf` handles all DataGolf calls, injecting the API key server-side so it's never exposed to the client

The API proxy (`api/datagolf.js`) whitelists allowed DataGolf endpoints, so the client can't query arbitrary external URLs.

---

## Future Improvements

- **Historical backtesting** — validate model recommendations against actual survivor pool outcomes from 2022–2024 PGA Tour seasons; calibrate opportunity cost coefficients to maximize simulated pool win rate
- **Cross-device sync** — replace localStorage with a lightweight backend (Supabase, Cloudflare KV) so picks persist across devices
- **Head-to-head differentiation** — track an opponent's used players and weight recommendations toward picks they can no longer match (OpponentTab in development)
- **Bayesian recalibration** — as the season progresses and the remaining schedule shrinks, dynamically adjust opportunity cost weights based on how many elevated events remain
- **Withdrawal risk signal** — penalize players with recent injury history or low tournament commitment indicators ahead of pick deadline

---

## Stack

React 18 · Vite · Vercel Serverless Functions · DataGolf API
