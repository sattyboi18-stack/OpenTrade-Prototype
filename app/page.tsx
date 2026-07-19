"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import theses from "@/data/theses.json";
import { useSwipes } from "@/lib/hooks";
import type { Thesis, Swipe } from "@/lib/pnl";
import { fmtUsd } from "@/lib/pnl";

const TODAY = "2026-07-17";
const all = theses as Thesis[];

export default function TodayDeck() {
  const { swipes, loaded, record } = useSwipes();
  const deck = useMemo(
    () => all.filter((t) => t.date === TODAY && !swipes[t.id]),
    [swipes]
  );

  if (!loaded) return null;

  return (
    <main>
      <h1 className="h1">Today&rsquo;s 10 theses.</h1>
      <p className="lede">
        Swipe right to back a call, left to pass. Every ticket is timestamped at
        today&rsquo;s price — tomorrow, the scoreboard starts keeping receipts on
        both of us.
      </p>
      {deck.length > 0 ? (
        <Deck deck={deck} onSwipe={record} />
      ) : (
        <div className="deck-wrap">
          <div className="deck-done">
            <div className="eyebrow">Deck cleared</div>
            <h2 className="section-h" style={{ marginTop: 8 }}>
              That&rsquo;s all 10 for today.
            </h2>
            <p className="lede" style={{ margin: "8px auto 20px" }}>
              Your calls are locked at today&rsquo;s prices. Come back tomorrow
              to see how they age.
            </p>
            <Link href="/scoreboard" className="btn accent">
              See your scoreboard
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function Deck({ deck, onSwipe }: { deck: Thesis[]; onSwipe: (id: string, s: Swipe) => void }) {
  const top = deck[0];
  const next = deck[1];
  return (
    <div className="deck-wrap">
      <div className="deck">
        {next && <Ticket key={next.id} t={next} style={{ transform: "scale(0.96) translateY(10px)", opacity: 0.6 }} />}
        <DraggableTicket key={top.id} t={top} onSwipe={onSwipe} />
      </div>
      <div className="deck-actions">
        <button className="btn ghost" onClick={() => onSwipe(top.id, "left")}>
          ← Pass
        </button>
        <button className="btn back" onClick={() => onSwipe(top.id, "right")}>
          Back it →
        </button>
      </div>
      <p className="deck-count eyebrow">{deck.length} of 10 remaining</p>
    </div>
  );
}

function Ticket({ t, style, children }: { t: Thesis; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <article className="ticket" style={style}>
      {children}
      <div className="ticket-head">
        <div>
          <div className="ticket-tick mono">{t.ticker}</div>
          <div className="ticket-co">{t.company}</div>
        </div>
        <span className={`pill ${t.direction}`}>{t.direction}</span>
      </div>
      <div className="ticket-body">{t.thesis}</div>
      <div className="ticket-stamp">
        <span className="ticket-agent">{t.agent} Agent</span>
        <span>
          entry {fmtUsd(t.entryPrice)} · {t.date}
        </span>
      </div>
    </article>
  );
}

function DraggableTicket({ t, onSwipe }: { t: Thesis; onSwipe: (id: string, s: Swipe) => void }) {
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<Swipe | null>(null);
  const start = useRef<number | null>(null);

  const commit = (dir: Swipe) => {
    setLeaving(dir);
    setTimeout(() => onSwipe(t.id, dir), 180);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (start.current === null) return;
    setDx(e.clientX - start.current);
  };
  const onPointerUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx > 100) commit("right");
    else if (dx < -100) commit("left");
    else setDx(0);
  };

  const offset = leaving ? (leaving === "right" ? 600 : -600) : dx;
  const style: React.CSSProperties = {
    transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
    transition: start.current === null ? "transform 0.18s ease" : "none",
    zIndex: 2,
  };

  return (
    <div
      className="ticket top"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") commit("right");
        if (e.key === "ArrowLeft") commit("left");
      }}
      tabIndex={0}
      role="group"
      aria-label={`${t.ticker} ${t.direction} thesis. Arrow right to back, arrow left to pass.`}
    >
      <span className="verdict back" style={{ opacity: Math.min(1, Math.max(0, offset / 110)) }}>
        BACKED
      </span>
      <span className="verdict pass" style={{ opacity: Math.min(1, Math.max(0, -offset / 110)) }}>
        PASS
      </span>
      <div className="ticket-head">
        <div>
          <div className="ticket-tick mono">{t.ticker}</div>
          <div className="ticket-co">{t.company}</div>
        </div>
        <span className={`pill ${t.direction}`}>{t.direction}</span>
      </div>
      <div className="ticket-body">{t.thesis}</div>
      <div className="ticket-stamp">
        <span className="ticket-agent">{t.agent} Agent</span>
        <span>
          entry {fmtUsd(t.entryPrice)} · {t.date}
        </span>
      </div>
    </div>
  );
}
