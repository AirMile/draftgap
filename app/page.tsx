"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePool } from "@/lib/use-pool";
import { PoolInput } from "@/components/pool-input";
import {
  findGaps,
  suggestChampions,
  suggestImprovements,
} from "@/lib/matchup-engine";
import { QuickPick } from "@/components/quick-pick";
import { EnemySearch } from "@/components/enemy-search";
import { BlindPickBan } from "@/components/blind-pick-ban";
import { BanTargets } from "@/components/ban-targets";
import { EnemyProfile } from "@/components/enemy-profile";
import { GapAnalysis } from "@/components/gap-analysis";
import { RolePicker } from "@/components/role-picker";
import { ChampionPicker } from "@/components/champion-picker";
import { RoleSelector } from "@/components/role-selector";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { DuoSynergy } from "@/components/duo-synergy";
import type { MatchupDataset, Tier } from "@/lib/types";

const DDRAGON_VERSION = "16.7.1";

const TIERS: { value: Tier; label: string }[] = [
  { value: "emerald_plus", label: "Emerald+" },
  { value: "platinum_plus", label: "Platinum+" },
  { value: "overall", label: "All Ranks" },
];

function TierSelector({
  patch,
  tier,
  onTierChange,
}: {
  patch: string | null;
  tier: Tier;
  onTierChange: (tier: Tier) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TIERS.find((t) => t.value === tier) ?? TIERS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="absolute right-0 hidden sm:flex items-center gap-2"
      ref={ref}
    >
      {patch && (
        <span className="text-xs text-muted hidden sm:inline">{patch}</span>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background border border-card-border rounded-lg px-3 py-1 text-sm text-muted font-medium h-[38px] flex items-center gap-1.5 hover:border-accent/30 transition-colors"
        >
          {selected.label}
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 bg-card border border-card-border rounded-lg z-20 min-w-full overflow-hidden">
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  onTierChange(t.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  tier === t.value
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:bg-card-border/30 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { pool, loaded, isValid, setRole, addChampion, removeChampion } =
    usePool();

  const [confirmed, setConfirmed] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const prevRole = useRef(pool?.role);

  const [championsForRole, setChampionsForRole] = useState<string[]>([]);
  const [championsLoading, setChampionsLoading] = useState(false);
  const [tier, setTier] = useState<Tier>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tier") as Tier | null;
      if (saved && TIERS.some((t) => t.value === saved)) return saved;
    }
    return "emerald_plus";
  });
  const [dataset, setDataset] = useState<MatchupDataset | null>(null);
  const [matchupLoading, setMatchupLoading] = useState(false);
  const [matchupError, setMatchupError] = useState<string | null>(null);
  const patchRef = useRef<string | null>(null);

  if (dataset?.patch) patchRef.current = dataset.patch;

  // When role changes, go to dashboard if pool has champions, otherwise picker
  useEffect(() => {
    if (pool?.role !== prevRole.current) {
      prevRole.current = pool?.role;
      setConfirmed(pool !== null && pool.champions.length > 0);
      setSelectedEnemy(null);
    }
  }, [pool?.role, pool?.champions.length]);

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
    setDataset(null);
    setMatchupLoading(true);
    setMatchupError(null);

    fetch(`/api/matchups/${pool.role}?tier=${tier}`)
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
  }, [pool?.role, tier]);

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
        gaps,
        dataset.championMeta ?? [],
      );
    }
    return suggestImprovements(
      pool.champions,
      gaps,
      dataset.matchups,
      dataset.champions,
    );
  }, [pool, gapOpponents, gaps, dataset]);

  const pickRateMap = useMemo(() => {
    const map = new Map<string, number>();
    if (dataset?.championMeta) {
      for (const m of dataset.championMeta) {
        map.set(m.champion, m.pickRate);
      }
    }
    return map;
  }, [dataset]);

  const blindPicks = useMemo(() => {
    if (!pool || !dataset) return [];
    return pool.champions
      .map((champ) => {
        const champMatchups = opponents
          .map((opp) => {
            const direct = dataset.matchups.find(
              (m) => m.champion === champ && m.opponent === opp,
            );
            if (direct) return direct;
            const reverse = dataset.matchups.find(
              (m) => m.champion === opp && m.opponent === champ,
            );
            if (reverse)
              return {
                ...reverse,
                champion: champ,
                opponent: opp,
                winrate: Math.round((100 - reverse.winrate) * 10) / 10,
              };
            return undefined;
          })
          .filter((m) => m !== undefined);
        if (champMatchups.length === 0) return null;
        const avgWinrate =
          Math.round(
            (champMatchups.reduce((sum, m) => sum + m.winrate, 0) /
              champMatchups.length) *
              10,
          ) / 10;
        return { champion: champ, avgWinrate };
      })
      .filter((p) => p !== null)
      .sort((a, b) => b.avgWinrate - a.avgWinrate)
      .slice(0, 5);
  }, [pool, opponents, dataset]);

  const banTargets = useMemo(() => {
    if (gaps.length === 0 || !pickRateMap.size) return [];
    return gaps
      .filter((g) => g.bestWinrate < 50 && pickRateMap.has(g.opponent))
      .map((g) => {
        const pickRate = pickRateMap.get(g.opponent)!;
        return {
          champion: g.opponent,
          pickRate,
          bestWinrate: g.bestWinrate,
          score: pickRate * (50 - g.bestWinrate),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [gaps, pickRateMap]);

  const coverage = useMemo(() => {
    if (gaps.length === 0) return null;
    const favorable = gaps.filter((g) => g.bestWinrate >= 50).length;
    const avg =
      Math.round(
        (gaps.reduce((sum, g) => sum + g.bestWinrate, 0) / gaps.length) * 10,
      ) / 10;
    return { favorable, total: gaps.length, avg };
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
        <div className="flex items-center justify-center relative">
          <RoleSelector role={pool.role} onRoleChange={setRole} />
          {confirmed && (
            <TierSelector
              patch={patchRef.current}
              tier={tier}
              onTierChange={(t) => {
                setTier(t);
                localStorage.setItem("tier", t);
              }}
            />
          )}
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

            <div>
              <EnemySearch
                opponents={opponents}
                version={DDRAGON_VERSION}
                selectedEnemy={selectedEnemy}
                onSelectEnemy={setSelectedEnemy}
                connected={!!selectedEnemy}
              />
              {selectedEnemy && analysisReady && (
                <>
                  <EnemyProfile
                    enemyId={selectedEnemy}
                    version={DDRAGON_VERSION}
                    pickRate={pickRateMap.get(selectedEnemy)}
                  />
                  <QuickPick
                    pool={pool.champions}
                    selectedEnemy={selectedEnemy}
                    matchups={dataset.matchups}
                    allChampions={championsForRole}
                    version={DDRAGON_VERSION}
                  />
                </>
              )}
            </div>

            {matchupError && (
              <p className="text-loss text-sm">{matchupError}</p>
            )}

            {analysisReady ? (
              <div className="bg-card border border-card-border rounded-lg overflow-hidden divide-y divide-card-border">
                {(blindPicks.length > 0 || banTargets.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
                    {blindPicks.length > 0 && (
                      <BlindPickBan
                        blindPicks={blindPicks}
                        version={DDRAGON_VERSION}
                      />
                    )}
                    {banTargets.length > 0 && (
                      <BanTargets
                        targets={banTargets}
                        version={DDRAGON_VERSION}
                      />
                    )}
                  </div>
                )}
                {(pool.role === "bot" || pool.role === "support") &&
                  dataset.duos &&
                  dataset.duos.length > 0 && (
                    <DuoSynergy
                      poolChampions={pool.champions}
                      duos={dataset.duos}
                      version={DDRAGON_VERSION}
                    />
                  )}
                <GapAnalysis
                  gaps={gaps}
                  suggestions={suggestions}
                  totalOpponents={opponents.length}
                  version={DDRAGON_VERSION}
                  onAddChampion={addChampion}
                  canAdd={true}
                />
              </div>
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
