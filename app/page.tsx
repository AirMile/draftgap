"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePool } from "@/lib/use-pool";
import { PoolInput } from "@/components/pool-input";
import {
  findGaps,
  suggestChampions,
  suggestImprovements,
  bestBlindPick,
} from "@/lib/matchup-engine";
import { QuickPick } from "@/components/quick-pick";
import { EnemySearch } from "@/components/enemy-search";
import { BlindPickBan } from "@/components/blind-pick-ban";
import { GapAnalysis } from "@/components/gap-analysis";
import { RolePicker } from "@/components/role-picker";
import { ChampionPicker } from "@/components/champion-picker";
import { RoleSelector } from "@/components/role-selector";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import type { MatchupDataset } from "@/lib/types";

const DDRAGON_VERSION = "16.7.1";

export default function Home() {
  const { pool, loaded, isValid, setRole, addChampion, removeChampion } =
    usePool();

  const [confirmed, setConfirmed] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const prevRole = useRef(pool?.role);

  const [championsForRole, setChampionsForRole] = useState<string[]>([]);
  const [championsLoading, setChampionsLoading] = useState(false);
  const [dataset, setDataset] = useState<MatchupDataset | null>(null);
  const [matchupLoading, setMatchupLoading] = useState(false);
  const [matchupError, setMatchupError] = useState<string | null>(null);

  // Reset confirmed state when role changes
  useEffect(() => {
    if (pool?.role !== prevRole.current) {
      prevRole.current = pool?.role;
      setConfirmed(false);
      setSelectedEnemy(null);
    }
  }, [pool?.role]);

  // Back to champion picker when pool is emptied
  useEffect(() => {
    if (confirmed && pool?.champions.length === 0) {
      setConfirmed(false);
    }
  }, [confirmed, pool?.champions.length]);

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
        if (!cancelled) {
          setChampionsForRole(champions);
          setChampionsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChampionsForRole([]);
          setChampionsLoading(false);
        }
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
    if (!pool || !dataset) return [];
    if (gapOpponents.length > 0) {
      return suggestChampions(
        pool.champions,
        gapOpponents,
        dataset.matchups,
        dataset.champions,
      );
    }
    return suggestImprovements(
      pool.champions,
      gaps,
      dataset.matchups,
      dataset.champions,
    );
  }, [pool, gapOpponents, gaps, dataset]);

  const blindPick = useMemo(() => {
    if (!pool || !dataset) return null;
    return bestBlindPick(pool.champions, opponents, dataset.matchups);
  }, [pool, opponents, dataset]);

  const banTarget = useMemo(() => {
    if (gaps.length === 0) return null;
    const worst = [...gaps].sort((a, b) => a.bestWinrate - b.bestWinrate)[0];
    return { opponent: worst.opponent, bestWinrate: worst.bestWinrate };
  }, [gaps]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!pool?.role) {
    return <RolePicker onSelectRole={setRole} />;
  }

  const analysisReady = isValid && dataset;

  return (
    <div className="min-h-screen flex flex-col px-4 py-4">
      <h1 className="sr-only">LoL Pool Optimizer</h1>

      <div
        className={`max-w-5xl mx-auto w-full ${!confirmed ? "flex flex-col flex-1 gap-6" : "space-y-6"}`}
      >
        <div className="flex justify-center">
          <RoleSelector role={pool.role} onRoleChange={setRole} />
        </div>

        {!confirmed ? (
          <ChampionPicker
            role={pool.role}
            champions={championsForRole}
            championsLoading={championsLoading}
            version={DDRAGON_VERSION}
            onConfirm={(selected) => {
              for (const c of selected) {
                addChampion(c);
              }
              setConfirmed(true);
            }}
          />
        ) : (
          <>
            {analysisReady && (
              <EnemySearch
                opponents={opponents}
                version={DDRAGON_VERSION}
                selectedEnemy={selectedEnemy}
                onSelectEnemy={setSelectedEnemy}
              />
            )}

            {analysisReady && (
              <QuickPick
                pool={pool.champions}
                selectedEnemy={selectedEnemy}
                matchups={dataset.matchups}
                allChampions={championsForRole}
                version={DDRAGON_VERSION}
              />
            )}

            <hr className="border-card-border max-w-xs mx-auto" />

            <PoolInput
              role={pool.role}
              champions={pool.champions}
              allChampions={championsForRole}
              version={DDRAGON_VERSION}
              onRoleChange={setRole}
              onAddChampion={addChampion}
              onRemoveChampion={removeChampion}
              compact
              hideRoleSelector
            />

            {analysisReady && (
              <BlindPickBan
                blindPick={blindPick}
                banTarget={banTarget}
                version={DDRAGON_VERSION}
              />
            )}

            {matchupError && (
              <p className="text-loss text-sm">{matchupError}</p>
            )}

            {analysisReady ? (
              <GapAnalysis
                gaps={gaps}
                suggestions={suggestions}
                totalOpponents={opponents.length}
                version={DDRAGON_VERSION}
                onAddChampion={addChampion}
                canAdd={true}
              />
            ) : championsLoading || matchupLoading ? (
              <DashboardSkeleton />
            ) : (
              <p className="text-muted text-sm py-8 text-center">
                {!pool?.role
                  ? "Select a role to get started."
                  : "Add a champion to analyze your matchups."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
