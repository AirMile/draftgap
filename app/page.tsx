"use client";

import { useEffect, useState, useMemo } from "react";
import { usePool } from "@/lib/use-pool";
import { PoolInput } from "@/components/pool-input";
import { findGaps, suggestChampions } from "@/lib/matchup-engine";
import { MatchupMatrix } from "@/components/matchup-matrix";
import { QuickPick } from "@/components/quick-pick";
import { GapAnalysis } from "@/components/gap-analysis";
import type { MatchupDataset } from "@/lib/types";

const DDRAGON_VERSION = "14.10.1";

export default function Home() {
  const {
    pool,
    loaded,
    isValid,
    setRole,
    addChampion,
    removeChampion,
    maxChampions,
  } = usePool();

  const [championsForRole, setChampionsForRole] = useState<string[]>([]);
  const [championsLoading, setChampionsLoading] = useState(false);
  const [dataset, setDataset] = useState<MatchupDataset | null>(null);
  const [matchupLoading, setMatchupLoading] = useState(false);
  const [matchupError, setMatchupError] = useState<string | null>(null);

  useEffect(() => {
    if (!pool?.role) {
      setChampionsForRole([]);
      return;
    }

    let cancelled = false;
    setChampionsLoading(true);

    fetch(`/api/champions/${pool.role}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((champions: string[]) => {
        if (!cancelled) setChampionsForRole(champions);
      })
      .catch(() => {
        if (!cancelled) setChampionsForRole([]);
      })
      .finally(() => {
        if (!cancelled) setChampionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pool?.role]);

  useEffect(() => {
    if (!pool?.role) {
      setDataset(null);
      return;
    }

    let cancelled = false;
    setMatchupLoading(true);
    setMatchupError(null);

    fetch(`/api/matchups/${pool.role}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<MatchupDataset>;
      })
      .then((data) => {
        if (!cancelled) setDataset(data);
      })
      .catch((err) => {
        if (!cancelled) setMatchupError(err.message);
      })
      .finally(() => {
        if (!cancelled) setMatchupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pool?.role]);

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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Laden...</div>
      </div>
    );
  }

  const poolProps = {
    role: pool?.role ?? null,
    champions: pool?.champions ?? [],
    allChampions: championsForRole,
    version: DDRAGON_VERSION,
    maxChampions,
    onRoleChange: setRole,
    onAddChampion: addChampion,
    onRemoveChampion: removeChampion,
  };

  const gapProps = {
    gaps,
    suggestions,
    totalOpponents: opponents.length,
    version: DDRAGON_VERSION,
    onAddChampion: addChampion,
    canAdd: pool ? pool.champions.length < maxChampions : false,
  };

  const analysisReady = isValid && dataset;

  return (
    <div className="min-h-screen flex flex-col">
      <h1 className="sr-only">LoL Pool Optimizer</h1>

      {/* Sticky pool bar: smal (<lg) + breed (xl+) */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-card-border lg:hidden xl:block">
        <div className="max-w-[1600px] mx-auto px-4 py-2">
          <PoolInput {...poolProps} compact />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 pt-4 pb-8 lg:flex lg:gap-6 xl:block">
        {/* Sidebar: medium only (lg → xl) */}
        <aside className="hidden lg:block xl:hidden w-64 shrink-0">
          <div className="sticky top-4 space-y-6">
            <PoolInput {...poolProps} />
            {analysisReady && <GapAnalysis {...gapProps} />}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 xl:flex xl:gap-6">
          {/* Left column: QuickPick + Gaps */}
          <div className="xl:w-[350px] xl:shrink-0">
            <div className="space-y-4 xl:sticky xl:top-14">
              {championsLoading && (
                <p className="text-muted text-sm">Champions laden...</p>
              )}
              {matchupError && (
                <p className="text-loss text-sm">{matchupError}</p>
              )}
              {isValid && matchupLoading && (
                <p className="text-muted text-sm">Matchup data ophalen...</p>
              )}

              {analysisReady ? (
                <>
                  <QuickPick
                    pool={pool!.champions}
                    opponents={opponents}
                    matchups={dataset.matchups}
                    allChampions={championsForRole}
                    version={DDRAGON_VERSION}
                  />
                  <div className="lg:hidden xl:block">
                    <GapAnalysis {...gapProps} />
                  </div>
                </>
              ) : (
                !championsLoading &&
                !matchupLoading && (
                  <p className="text-muted text-sm py-8 text-center lg:text-left">
                    {!pool?.role
                      ? "Selecteer een role om te beginnen."
                      : "Voeg een champion toe om je matchups te analyseren."}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Right column: Matrix */}
          <div className="flex-1 min-w-0 mt-4 xl:mt-0">
            {analysisReady && (
              <MatchupMatrix
                pool={pool!.champions}
                opponents={opponents}
                matchups={dataset.matchups}
                gapOpponents={gapOpponents}
                version={DDRAGON_VERSION}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
