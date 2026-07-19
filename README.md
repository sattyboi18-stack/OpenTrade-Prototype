# OpenTrade — Track Record (prototype)

Every thesis timestamped at its entry price. Every call scored forward. The
receipts on the agents — and on your swipes.

Three pages:

- **/** — Today's deck of 10 theses. Swipe (drag, buttons, or arrow keys).
- **/scoreboard** — Your backed calls marked to market, plus what you dodged
  and what you missed. Compares your selection vs. backing the whole deck.
- **/agents** — Public per-agent track record: avg return, hit rate,
  best/worst call. No cherry-picking.

`lib/pnl.ts` is the liftable module: pure functions (theses + prices in,
scoreboard out), no React or fetch. Drop it into the main codebase as-is.

## Deploy in ~20 minutes

```bash
npm install
npm run seed        # pulls REAL entry prices + latest closes from Stooq (no API key)
npm run dev         # check localhost:3000
```

Then push to GitHub and import into Vercel. Optional but recommended:

1. Get a free Finnhub key at finnhub.io
2. In Vercel → Settings → Environment Variables: `FINNHUB_API_KEY=<key>`
3. Redeploy. The prices API now serves live quotes (2-min cache); without a
   key it falls back to the seeded closes so the demo never breaks.

Re-run `npm run seed` and redeploy each morning of the trial so entry prices
stay real.

## How it works

- `data/theses.json` — 24 backdated calls (Jun 25–Jul 16) + today's 10.
  Agent names and thesis text are illustrative; entry prices are real closes
  once seeded.
- `scripts/seed.mjs` — fetches daily history from Stooq (keyless), sets each
  thesis's `entryPrice` to the close on its publish date and `fallbackPrice`
  to the latest close.
- `app/api/prices` — batch quote endpoint. Live via Finnhub if the env key
  exists, seeded closes otherwise.
- Swipes live in `localStorage` — deliberately no auth/DB for a one-day
  prototype. The scoreboard has a "backfill sample swipes" button so a
  first-time visitor (i.e. the founders) sees a populated page instantly.

## Demo script (60 seconds)

1. Open **/** — swipe two or three of today's tickets. Point out the entry
   price stamped on each one: "the moment you see a thesis, it's on the record."
2. Open **/scoreboard** — hit backfill if fresh. Walk the four stats:
   your avg return, the back-everything baseline, hit rate, and **edge vs.
   deck** — that last number isolates whether swiping adds skill or noise.
3. Show **Dodged** and **Missed**: "passing is a call too — this is what makes
   the swipe a game you get better at instead of a slot machine."
4. Open **/agents** — "and this is your internal eval system for free: which
   agents generate alpha, which generate content."

## Honest limitations (say these before they ask)

- Returns are price-only (no dividends, no sizing, no execution slippage).
- LocalStorage means per-device records; production would key swipes to the
  existing user accounts.
- Agent theses here are seeded, not generated — the point of the prototype is
  the accountability loop, which wraps around whatever the real agents publish.
