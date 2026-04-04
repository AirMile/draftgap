"use client";

import { useState, useCallback, useEffect } from "react";
import type { PoolState, Role } from "@/lib/types";

const MIN_CHAMPIONS = 1;
const STORAGE_KEY = "lol-pool-optimizer-pools";

type PerRolePools = Partial<Record<Role, string[]>>;

function loadPools(): PerRolePools {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PerRolePools) : {};
  } catch {
    return {};
  }
}

function savePools(pools: PerRolePools) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
  } catch {
    // quota exceeded, silently ignore
  }
}

export function usePool() {
  const [pool, setPool] = useState<PoolState | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setLoaded(true);
  }, []);

  const setRole = useCallback((role: Role) => {
    setPool((prev) => {
      if (prev?.role === role) return prev;
      const pools = loadPools();
      const savedChampions = pools[role] ?? [];
      return { role, champions: savedChampions };
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
      const pools = loadPools();
      pools[next.role] = next.champions;
      savePools(pools);
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
      const pools = loadPools();
      pools[next.role] = next.champions;
      savePools(pools);
      return next;
    });
  }, []);

  const clearPool = useCallback(() => {
    setPool((prev) => {
      if (!prev) return null;
      const pools = loadPools();
      delete pools[prev.role];
      savePools(pools);
      return null;
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
    clearPool,
    minChampions: MIN_CHAMPIONS,
  };
}
