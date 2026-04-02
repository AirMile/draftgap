"use client";

import { useState, useEffect, useCallback } from "react";
import type { PoolState, Role } from "@/lib/types";

const STORAGE_KEY = "lol-pool-optimizer-pool";
const MIN_CHAMPIONS = 2;
const MAX_CHAMPIONS = 5;

function loadPool(): PoolState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PoolState;
    if (parsed.role && Array.isArray(parsed.champions)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function savePool(pool: PoolState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
}

export function usePool() {
  const [pool, setPool] = useState<PoolState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPool(loadPool());
    setLoaded(true);
  }, []);

  const setRole = useCallback((role: Role) => {
    setPool((prev) => {
      const next: PoolState = { role, champions: prev?.champions ?? [] };
      savePool(next);
      return next;
    });
  }, []);

  const addChampion = useCallback((championId: string): boolean => {
    let added = false;
    setPool((prev) => {
      if (!prev) return prev;
      if (prev.champions.length >= MAX_CHAMPIONS) return prev;
      if (prev.champions.includes(championId)) return prev;
      const next: PoolState = {
        ...prev,
        champions: [...prev.champions, championId],
      };
      savePool(next);
      added = true;
      return next;
    });
    return added;
  }, []);

  const removeChampion = useCallback((championId: string) => {
    setPool((prev) => {
      if (!prev) return prev;
      const next: PoolState = {
        ...prev,
        champions: prev.champions.filter((c) => c !== championId),
      };
      savePool(next);
      return next;
    });
  }, []);

  const clearPool = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPool(null);
  }, []);

  const isValid =
    pool !== null &&
    pool.champions.length >= MIN_CHAMPIONS &&
    pool.champions.length <= MAX_CHAMPIONS;

  return {
    pool,
    loaded,
    isValid,
    setRole,
    addChampion,
    removeChampion,
    clearPool,
    minChampions: MIN_CHAMPIONS,
    maxChampions: MAX_CHAMPIONS,
  };
}
