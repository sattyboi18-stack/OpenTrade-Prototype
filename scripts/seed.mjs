// Backfills REAL entry prices and latest closes into data/theses.json
// using Yahoo Finance's keyless chart API (Stooq fallback).
// Run once before deploying:  npm run seed
import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../data/theses.json", import.meta.url);
const theses = JSON.parse(await readFile(DATA, "utf8"));
const tickers = [...new Set(theses.map((t) => t.ticker))];
const UA = { "User-Agent": "Mozilla/5.0" };

async function yahoo(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=3mo&interval=1d`;
  const res = await fetch(url, { headers: UA });
  const d = await res.json();
  const r = d.chart?.result?.[0];
  if (!r?.timestamp) throw new Error("no data");
  const closes = new Map();
  let last = null;
  r.timestamp.forEach((ts, i) => {
    const c = r.indicators.quote[0].close[i];
    if (!Number.isFinite(c)) return;
    const iso = new Date(ts * 1000).toISOString().slice(0, 10);
    closes.set(iso, c);
    last = c;
  });
  return { closes, last };
}

async function stooq(ticker) {
  const url = `https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.us&d1=20260601&d2=20991231&i=d`;
  const res = await fetch(url);
  const rows = (await res.text()).trim().split("\n").slice(1);
  const closes = new Map();
  let last = null;
  for (const row of rows) {
    const [date, , , , close] = row.split(",");
    const c = parseFloat(close);
    if (!Number.isFinite(c)) continue;
    closes.set(date, c);
    last = c;
  }
  if (closes.size === 0) throw new Error("no data");
  return { closes, last };
}

function closeOnOrBefore(closes, iso) {
  const d = new Date(iso + "T00:00:00Z");
  for (let i = 0; i < 7; i++) {
    const key = d.toISOString().slice(0, 10);
    if (closes.has(key)) return closes.get(key);
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return null;
}

const cache = {};
for (const tk of tickers) {
  try {
    cache[tk] = await yahoo(tk);
  } catch {
    try { cache[tk] = await stooq(tk); } catch (e) {
      console.warn(`${tk}: all sources failed — keeping placeholder prices`);
      continue;
    }
  }
  console.log(`${tk}: ${cache[tk].closes.size} sessions, last close ${cache[tk].last?.toFixed(2)}`);
  await new Promise((r) => setTimeout(r, 300));
}

let updated = 0;
for (const t of theses) {
  const h = cache[t.ticker];
  if (!h) continue;
  const entry = closeOnOrBefore(h.closes, t.date);
  if (entry) { t.entryPrice = Math.round(entry * 100) / 100; updated++; }
  if (h.last) t.fallbackPrice = Math.round(h.last * 100) / 100;
}

await writeFile(DATA, JSON.stringify(theses, null, 1));
console.log(`\nSeed complete: ${updated}/${theses.length} entry prices set from real market data.`);
