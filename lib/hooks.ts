"use client";
import { useEffect, useState, useCallback } from "react";
import type { PriceMap, Swipe } from "./pnl";

export function usePrices() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [source, setSource] = useState<"seed" | "live" | "loading">("loading");
  useEffect(() => {
    let alive = true;
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setPrices(d.prices ?? {});
        setSource(d.source ?? "seed");
      })
      .catch(() => alive && setSource("seed"));
    return () => {
      alive = false;
    };
  }, []);
  return { prices, source };
}

const KEY = "ot-swipes";

export function useSwipes() {
  const [swipes, setSwipes] = useState<Record<string, Swipe>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setSwipes(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {
      /* fresh start */
    }
    setLoaded(true);
  }, []);

  const record = useCallback((id: string, dir: Swipe) => {
    setSwipes((prev) => {
      const next = { ...prev, [id]: dir };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const bulkRecord = useCallback((entries: Record<string, Swipe>) => {
    setSwipes((prev) => {
      const next = { ...prev, ...entries };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setSwipes({});
  }, []);

  return { swipes, loaded, record, bulkRecord, reset };
}
