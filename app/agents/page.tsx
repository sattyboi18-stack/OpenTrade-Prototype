"use client";
import { useMemo } from "react";
import theses from "@/data/theses.json";
import { usePrices } from "@/lib/hooks";
import { score, byAgent, aggregate, fmtPct, type Thesis } from "@/lib/pnl";

const TODAY = "2026-07-17";
const all = theses as Thesis[];

export default function Agents() {
  const { prices, source } = usePrices();
  const scored = useMemo(
    () => score(all, prices).filter((s) => s.thesis.date !== TODAY),
    [prices]
  );
  const groups = byAgent(scored);
  const ranked = Array.from(groups.entries())
    .map(([agent, rows]) => ({ agent, agg: aggregate(rows) }))
    .sort((a, b) => b.agg.avgRet - a.agg.avgRet);

  return (
    <main>
      <h1 className="h1">The agents, held accountable.</h1>
      <p className="lede">
        Public track record for every thesis agent — no cherry-picking, no
        memory-holing losers. Every call since launch, marked to market.
      </p>
      <div className="agent-grid">
        {ranked.map(({ agent, agg }, i) => (
          <div className="agent-card" key={agent}>
            <div className="agent-rank">#{i + 1} of {ranked.length}</div>
            <div className="agent-name">{agent} Agent</div>
            <div className={`agent-big ${agg.avgRet >= 0 ? "up" : "down"}`}>
              {fmtPct(agg.avgRet)}
            </div>
            <div className="stat-sub" style={{ marginBottom: 12 }}>avg return per call</div>
            <div className="agent-line"><span>Calls published</span><b>{agg.count}</b></div>
            <div className="agent-line"><span>Hit rate</span><b>{agg.hitRate.toFixed(0)}%</b></div>
            {agg.best && (
              <div className="agent-line">
                <span>Best call</span>
                <b>{agg.best.thesis.ticker} {fmtPct(agg.best.ret)}</b>
              </div>
            )}
            {agg.worst && (
              <div className="agent-line">
                <span>Worst call</span>
                <b>{agg.worst.thesis.ticker} {fmtPct(agg.worst.ret)}</b>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="src-note">
        prices: {source === "live" ? "live via Finnhub" : <b>seeded closes (set FINNHUB_API_KEY for live)</b>} · window: since 2026-06-25
      </p>
    </main>
  );
}
