"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePool } from "@/lib/use-pool";
import { findGaps, suggestChampions } from "@/lib/matchup-engine";
import { MatchupMatrix } from "@/components/matchup-matrix";
import { QuickPick } from "@/components/quick-pick";
import { GapAnalysis } from "@/components/gap-analysis";
import type { MatchupDataset } from "@/lib/types";
import roleMapping from "@/data/role-mapping.json";

const DDRAGON_VERSION = "14.10.1";

export default function PoolPage() {
  const router = useRouter();
  const { pool, loaded, isValid } = usePool();

  const [dataset, setDataset] = useState<MatchupDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && !isValid) {
      router.replace("/");
    }
  }, [loaded, isValid, router]);

  useEffect(() => {
    if (!pool) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/matchups/${pool.role}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: MatchupDataset) => {
        if (!cancelled) setDataset(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pool?.role]);

  // Only show opponents where we have matchup data for at least one pool champion
  const opponents = useMemo(() => {
    if (!pool || !dataset) return [];
    const knownOpponents = new Set(
      dataset.matchups
        .filter((m) => pool.champions.includes(m.champion))
        .map((m) => m.opponent),
    );
    return [...knownOpponents];
  }, [pool, dataset]);

  const allRoleChampions = useMemo(() => {
    if (!pool) return [];
    return Object.entries(roleMapping)
      .filter(([, roles]) => (roles as string[]).includes(pool.role))
      .map(([name]) => name);
  }, [pool]);

  const gaps = useMemo(() => {
    if (!pool || !dataset) return [];
    return findGaps(pool.champions, opponents, dataset.matchups);
  }, [pool, opponents, dataset]);

  const gapOpponents = useMemo(
    () => gaps.filter((g) => g.isGap).map((g) => g.opponent),
    [gaps],
  );

  const suggestions = useMemo(() => {
    if (!pool || !dataset || gapOpponents.length === 0) return [];
    return suggestChampions(
      pool.champions,
      gapOpponents,
      dataset.matchups,
      dataset.champions,
    );
  }, [pool, gapOpponents, dataset]);

  if (!loaded || !pool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Laden...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Matchup data ophalen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-loss">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-card border border-card-border rounded-lg text-sm hover:border-accent-dim transition-colors"
          >
            Terug
          </button>
        </div>
      </div>
    );
  }

  if (!dataset) return null;

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
