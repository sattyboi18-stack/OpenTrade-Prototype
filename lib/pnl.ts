// Pure P&L logic. No React, no fetch — designed to be lifted straight
// into the main OpenTrade codebase.

export type Direction = "long" | "short";
export type Swipe = "right" | "left";

export interface Thesis {
  id: string;
  date: string; // ISO date the agents published the call (entry timestamp)
  agent: string;
  ticker: string;
  company: string;
  direction: Direction;
  thesis: string;
  entryPrice: number; // close on publish date (set by scripts/seed.mjs)
  fallbackPrice: number; // most recent close, used when no live feed
}

export type PriceMap = Record<string, number>;

export function currentPrice(t: Thesis, live: PriceMap): number {
  const p = live[t.ticker];
  return typeof p === "number" && p > 0 ? p : t.fallbackPrice;
}

/** Signed return % of the call since entry. Short calls profit when price falls. */
export function returnPct(t: Thesis, price: number): number {
  const raw = (price - t.entryPrice) / t.entryPrice;
  return (t.direction === "long" ? raw : -raw) * 100;
}

export function daysHeld(t: Thesis, now = new Date()): number {
  const ms = now.getTime() - new Date(t.date + "T16:00:00").getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export interface Scored {
  thesis: Thesis;
  price: number;
  ret: number; // signed % return of the call itself
  days: number;
}

export function score(theses: Thesis[], live: PriceMap, now = new Date()): Scored[] {
  return theses.map((t) => {
    const price = currentPrice(t, live);
    return { thesis: t, price, ret: returnPct(t, price), days: daysHeld(t, now) };
  });
}

export interface Aggregate {
  count: number;
  avgRet: number;
  hitRate: number; // % of calls with positive return
  best: Scored | null;
  worst: Scored | null;
}

export function aggregate(rows: Scored[]): Aggregate {
  if (rows.length === 0)
    return { count: 0, avgRet: 0, hitRate: 0, best: null, worst: null };
  const avgRet = rows.reduce((s, r) => s + r.ret, 0) / rows.length;
  const hits = rows.filter((r) => r.ret > 0).length;
  const sorted = [...rows].sort((a, b) => b.ret - a.ret);
  return {
    count: rows.length,
    avgRet,
    hitRate: (hits / rows.length) * 100,
    best: sorted[0],
    worst: sorted[sorted.length - 1],
  };
}

export function byAgent(rows: Scored[]): Map<string, Scored[]> {
  const m = new Map<string, Scored[]>();
  for (const r of rows) {
    const list = m.get(r.thesis.agent) ?? [];
    list.push(r);
    m.set(r.thesis.agent, list);
  }
  return m;
}

export const fmtPct = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export const fmtUsd = (n: number) =>
  n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$${n.toFixed(2)}`;
