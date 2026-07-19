import { NextResponse } from "next/server";
import theses from "@/data/theses.json";
import type { Thesis } from "@/lib/pnl";

export const dynamic = "force-dynamic";

const all = theses as Thesis[];

export async function GET() {
  const tickers = Array.from(new Set(all.map((t) => t.ticker)));
  const fallback: Record<string, number> = {};
  for (const t of all) fallback[t.ticker] = t.fallbackPrice;

  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return NextResponse.json({ prices: fallback, source: "seed", asOf: new Date().toISOString() });
  }

  const prices: Record<string, number> = { ...fallback };
  let liveCount = 0;
  await Promise.all(
    tickers.map(async (tk) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${tk}&token=${key}`,
          { next: { revalidate: 120 } }
        );
        const q = await res.json();
        if (typeof q.c === "number" && q.c > 0) {
          prices[tk] = q.c;
          liveCount++;
        }
      } catch {
        /* keep fallback */
      }
    })
  );

  return NextResponse.json({
    prices,
    source: liveCount > 0 ? "live" : "seed",
    asOf: new Date().toISOString(),
  });
}
