"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePool } from "@/lib/use-pool";
import { findGaps, suggestChampions } from "@/lib/matchup-engine";
import { MatchupMatrix } from "@/components/matchup-matrix";
import { QuickPick } from "@/components/quick-pick";
import { GapAnalysis } from "@/components/gap-analysis";
import type { MatchupDataset } from "@/lib/types";

const DDRAGON_VERSION = "14.10.1";

export default function PoolPage() {
  const router = useRouter();
  const { pool, loaded, isValid, addChampion, removeChampion, maxChampions } =
    usePool();

  const [dataset, setDataset] = useState<MatchupDataset | null>(null);
  const [allRoleChampions, setAllRoleChampions] = useState<string[]>([]);
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

    Promise.all([
      fetch(`/api/matchups/${pool.role}`).then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<MatchupDataset>;
      }),
      fetch(`/api/champions/${pool.role}`).then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<string[]>;
      }),
    ])
      .then(([matchupData, champions]) => {
        if (!cancelled) {
          setDataset(matchupData);
          setAllRoleChampions(champions);
        }
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

  // Only show opponents that are meta in this role AND have matchup data vs pool
  const roleChampions = useMemo(
    () => new Set(dataset?.champions ?? []),
    [dataset],
  );

  const opponents = useMemo(() => {
    if (!pool || !dataset) return [];
    const knownOpponents = new Set<string>();
    for (const m of dataset.matchups) {
      if (
        pool.champions.includes(m.champion) &&
        roleChampions.has(m.opponent)
      ) {
        knownOpponents.add(m.opponent);
      }
      if (
        pool.champions.includes(m.opponent) &&
        roleChampions.has(m.champion)
      ) {
        knownOpponents.add(m.champion);
      }
    }
    // Don't include pool champions as opponents
    for (const c of pool.champions) {
      knownOpponents.delete(c);
    }
    return [...knownOpponents];
  }, [pool, dataset, roleChampions]);

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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-muted text-sm">
                {pool.role.charAt(0).toUpperCase() + pool.role.slice(1)} —
              </span>
              {pool.champions.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 bg-card border border-card-border rounded-md px-2 py-0.5 text-sm"
                >
                  {c}
                  <button
                    onClick={() => removeChampion(c)}
                    className="text-muted hover:text-loss ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
          onAddChampion={addChampion}
          canAdd={pool.champions.length < maxChampions}
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
