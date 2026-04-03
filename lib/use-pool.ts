"use client";

import { useState, useCallback } from "react";
import type { PoolState, Role } from "@/lib/types";

const MIN_CHAMPIONS = 1;

export function usePool() {
  const [pool, setPool] = useState<PoolState | null>(null);
  const loaded = true;

  const setRole = useCallback((role: Role) => {
    setPool((prev) => {
      if (prev?.role === role) return prev;
      const next: PoolState = { role, champions: [] };
      return next;
    });
  }, []);

  const addChampion = useCallback((championId: string): boolean => {
    let added = false;
    setPool((prev) => {
      if (!prev) return prev;
      if (prev.champions.includes(championId)) return prev;
      const next: PoolState = {
        ...prev,
        champions: [...prev.champions, championId],
      };
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
      return next;
    });
  }, []);

  const isValid = pool !== null && pool.champions.length >= MIN_CHAMPIONS;

  return {
    pool,
    loaded,
    isValid,
    setRole,
    addChampion,
    removeChampion,
    minChampions: MIN_CHAMPIONS,
  };
}
