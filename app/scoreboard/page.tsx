"use client";
import { useMemo } from "react";
import Link from "next/link";
import theses from "@/data/theses.json";
import { usePrices, useSwipes } from "@/lib/hooks";
import { score, aggregate, fmtPct, fmtUsd, type Thesis, type Scored, type Swipe } from "@/lib/pnl";

const TODAY = "2026-07-17";
const all = theses as Thesis[];

export default function Scoreboard() {
  const { prices, source } = usePrices();
  const { swipes, loaded, bulkRecord, reset } = useSwipes();

  const scored = useMemo(() => score(all, prices), [prices]);
  const past = scored.filter((s) => s.thesis.date !== TODAY);
  const backed = past.filter((s) => swipes[s.thesis.id] === "right");
  const passed = past.filter((s) => swipes[s.thesis.id] === "left");
  const todayBacked = scored.filter((s) => s.thesis.date === TODAY && swipes[s.thesis.id] === "right");

  const backedAgg = aggregate(backed);
  const deckAgg = aggregate(past);
  const dodged = passed.filter((s) => s.ret < 0);
  const missed = passed.filter((s) => s.ret > 0);

  if (!loaded) return null;

  const hasHistory = backed.length + passed.length + todayBacked.length > 0;

  const backfill = () => {
    const entries: Record<string, Swipe> = {};
    for (const s of past) entries[s.thesis.id] = Math.random() < 0.55 ? "right" : "left";
    bulkRecord(entries);
  };

  return (
    <main>
      <h1 className="h1">Your swipes vs. the market.</h1>
      <p className="lede">
        Every thesis was stamped with its price the morning the agents published
        it. This is what your calls — and your passes — are worth today.
      </p>

      {!hasHistory ? (
        <div className="empty">
          <div className="eyebrow">No history yet</div>
          <p>
            Swipe today&rsquo;s deck to start your record — or backfill three
            weeks of sample swipes to preview what this page becomes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/" className="btn back">Swipe today&rsquo;s deck</Link>
            <button className="btn ghost" onClick={backfill}>Backfill sample swipes</button>
          </div>
        </div>
      ) : (
        <>
          <div className="statgrid">
            <div className="stat">
              <span className="eyebrow">Your backed calls</span>
              <div className={`stat-num ${backedAgg.avgRet >= 0 ? "" : ""}`} style={{ color: backedAgg.avgRet >= 0 ? "var(--up)" : "var(--down)" }}>
                {fmtPct(backedAgg.avgRet)}
              </div>
              <div className="stat-sub">avg return · {backed.length} calls</div>
            </div>
            <div className="stat">
              <span className="eyebrow">Backing everything</span>
              <div className="stat-num" style={{ color: deckAgg.avgRet >= 0 ? "var(--up)" : "var(--down)" }}>
                {fmtPct(deckAgg.avgRet)}
              </div>
              <div className="stat-sub">full-deck baseline · {past.length} calls</div>
            </div>
            <div className="stat">
              <span className="eyebrow">Your hit rate</span>
              <div className="stat-num">{backedAgg.hitRate.toFixed(0)}%</div>
              <div className="stat-sub">of backed calls in profit</div>
            </div>
            <div className="stat">
              <span className="eyebrow">Edge vs. deck</span>
              <div className="stat-num" style={{ color: backedAgg.avgRet - deckAgg.avgRet >= 0 ? "var(--up)" : "var(--down)" }}>
                {fmtPct(backedAgg.avgRet - deckAgg.avgRet)}
              </div>
              <div className="stat-sub">your selection skill, isolated</div>
            </div>
          </div>

          <Section
            title="Backed"
            sub="Calls you swiped right on, marked to market."
            rows={backed}
            note={(s) => `${s.days}d held`}
          />
          <Section
            title="Dodged"
            sub="Calls you passed on that went against the agents. Passing is a call too."
            rows={dodged}
            invert
            note={() => "avoided"}
          />
          <Section
            title="Missed"
            sub="Calls you passed on that worked. The scoreboard keeps you honest in both directions."
            rows={missed}
            note={() => "left on table"}
          />

          {todayBacked.length > 0 && (
            <>
              <h2 className="section-h">Locked today</h2>
              <p className="section-sub">
                Stamped at this morning&rsquo;s prices. Scoring starts at tomorrow&rsquo;s close.
              </p>
              <div className="rows">
                {todayBacked.map((s) => (
                  <Row key={s.thesis.id} s={s} noteText="pending" pending />
                ))}
              </div>
            </>
          )}

          <p className="src-note">
            prices: {source === "live" ? "live via Finnhub" : <b>seeded closes (set FINNHUB_API_KEY for live)</b>} ·{" "}
            <button className="btn ghost" style={{ padding: "4px 12px", fontSize: 12 }} onClick={reset}>
              reset my swipes
            </button>
          </p>
        </>
      )}
    </main>
  );
}

function Section({
  title, sub, rows, note, invert = false,
}: {
  title: string; sub: string; rows: Scored[];
  note: (s: Scored) => string; invert?: boolean;
}) {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => (invert ? a.ret - b.ret : b.ret - a.ret));
  return (
    <>
      <h2 className="section-h">{title}</h2>
      <p className="section-sub">{sub}</p>
      <div className="rows">
        {sorted.map((s) => (
          <Row key={s.thesis.id} s={s} noteText={note(s)} />
        ))}
      </div>
    </>
  );
}

function Row({ s, noteText, pending = false }: { s: Scored; noteText: string; pending?: boolean }) {
  const t = s.thesis;
  return (
    <div className="row">
      <div>
        <div className="row-tick">{t.ticker}</div>
        <div className={`row-dir ${t.direction}`}>{t.direction}</div>
      </div>
      <div className="row-mid">
        <div className="row-thesis">{t.thesis}</div>
        <div className="row-meta">
          {t.agent} Agent · {t.date} · entry {fmtUsd(t.entryPrice)} → now {fmtUsd(s.price)}
        </div>
      </div>
      <div className={`ret ${pending ? "" : s.ret >= 0 ? "up" : "down"}`}>
        {pending ? "—" : fmtPct(s.ret)}
        <span className="ret-note">{noteText}</span>
      </div>
    </div>
  );
}
