"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePool } from "@/lib/use-pool";
import { findGaps, suggestChampions } from "@/lib/matchup-engine";
import { MatchupMatrix } from "@/components/matchup-matrix";
import { QuickPick } from "@/components/quick-pick";
import { GapAnalysis } from "@/components/gap-analysis";
import type { MatchupDataset } from "@/lib/types";
import mockMatchups from "@/data/mock-matchups.json";
import roleMapping from "@/data/role-mapping.json";

const DDRAGON_VERSION = "14.10.1";

export default function PoolPage() {
  const router = useRouter();
  const { pool, loaded, isValid } = usePool();

  useEffect(() => {
    if (loaded && !isValid) {
      router.replace("/");
    }
  }, [loaded, isValid, router]);

  const dataset = mockMatchups as MatchupDataset;

  const opponents = useMemo(() => {
    if (!pool) return [];
    return dataset.champions.filter((c) => !pool.champions.includes(c));
  }, [pool, dataset.champions]);

  const allRoleChampions = useMemo(() => {
    if (!pool) return [];
    return Object.entries(roleMapping)
      .filter(([, roles]) => (roles as string[]).includes(pool.role))
      .map(([name]) => name);
  }, [pool]);

  const gaps = useMemo(() => {
    if (!pool) return [];
    return findGaps(pool.champions, opponents, dataset.matchups);
  }, [pool, opponents, dataset.matchups]);

  const gapOpponents = useMemo(
    () => gaps.filter((g) => g.isGap).map((g) => g.opponent),
    [gaps],
  );

  const suggestions = useMemo(() => {
    if (!pool || gapOpponents.length === 0) return [];
    return suggestChampions(
      pool.champions,
      gapOpponents,
      dataset.matchups,
      dataset.champions,
    );
  }, [pool, gapOpponents, dataset.matchups, dataset.champions]);

  if (!loaded || !pool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-accent">
              LoL Pool Optimizer
            </h1>
            <p className="text-muted text-sm">
              {pool.role.charAt(0).toUpperCase() + pool.role.slice(1)} —{" "}
              {pool.champions.join(", ")}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-card border border-card-border rounded-lg text-sm hover:border-accent-dim transition-colors"
          >
            Edit Pool
          </button>
        </div>

        <QuickPick
          pool={pool.champions}
          opponents={opponents}
          matchups={dataset.matchups}
          allChampions={allRoleChampions}
          version={DDRAGON_VERSION}
        />

        <GapAnalysis
          gaps={gaps}
          suggestions={suggestions}
          totalOpponents={opponents.length}
          version={DDRAGON_VERSION}
        />

        <MatchupMatrix
          pool={pool.champions}
          opponents={opponents}
          matchups={dataset.matchups}
          gapOpponents={gapOpponents}
          version={DDRAGON_VERSION}
        />
      </div>
    </div>
  );
}
