"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import { PoolGrade } from "@/components/pool-grade";
import { ShareButton } from "@/components/share-button";
import { Logo } from "@/components/logo";
import { computePoolScore } from "@/lib/pool-score";
import { parseShareParams } from "@/lib/url-sharing";
import type { MatchupDataset, PoolState, Role, Tier } from "@/lib/types";

const DDRAGON_VERSION = "16.7.1";

function RolePickerSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-6 sm:gap-0">
      <div className="text-center sm:hidden">
        <div className="skeleton mx-auto w-40 h-8" />
        <div className="skeleton mx-auto w-28 h-4 mt-2" />
      </div>
      <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-5 w-full max-w-md sm:max-w-4xl">
        <div className="absolute inset-x-0 -top-28 text-center pointer-events-none hidden sm:block">
          <div className="skeleton mx-auto w-52 h-10" />
          <div className="skeleton mx-auto w-32 h-5 mt-2" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton !rounded-2xl aspect-[16/9] sm:aspect-[2/5]"
          />
        ))}
      </div>
    </div>
  );
}

function ConfirmedSkeleton({ championCount }: { championCount: number }) {
  return (
    <>
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
        <div className="border-b border-card-border pb-2 -mx-4 px-4">
          <div className="skeleton w-32 h-6" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {Array.from({ length: championCount }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 sm:gap-2 border border-card-border rounded-lg px-2 sm:px-2.5 py-1"
              >
                <div className="skeleton !rounded-full w-5 h-5 shrink-0" />
                <div className="skeleton h-3.5 w-12 sm:w-16" />
                <div className="w-4 sm:w-5" />
              </div>
            ))}
          </div>
          <div className="flex justify-end min-h-[30px]">
            <div className="skeleton !rounded-lg w-[53px] h-[30px]" />
          </div>
        </div>
      </div>
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="skeleton w-48 h-6" />
      </div>
      <DashboardSkeleton />
    </>
  );
}

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
      className="absolute right-0 hidden sm:flex items-center gap-3"
      ref={ref}
    >
      {patch && (
        <span className="text-xs text-muted hidden sm:inline">{patch}</span>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background border border-card-border rounded-lg px-3 py-1 text-sm text-muted font-medium h-[38px] flex items-center gap-1.5 hover:border-accent/30 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
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

  const [sharedPool, setSharedPool] = useState<PoolState | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const prevRole = useRef(pool?.role);

  const [championsForRole, setChampionsForRole] = useState<string[]>([]);
  const [championsLoading, setChampionsLoading] = useState(false);

  // Wrap setRole to synchronously reset champions state in the same event
  // handler tick, preventing a flash of stale champions before the effect runs.
  const handleRoleChange = useCallback(
    (role: Role) => {
      if (pool?.role === role) return;
      setChampionsForRole([]);
      setChampionsLoading(true);
      setRole(role);
    },
    [setRole, pool?.role],
  );
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

  // Parse shared pool from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = parseShareParams(params);
    if (shared) {
      setSharedPool({ role: shared.role, champions: shared.champions });
      setTier(shared.tier);
      setConfirmed(true);
    }
  }, []);

  // The effective pool: shared pool overrides local pool
  const activePool = sharedPool ?? pool;
  const activeIsValid = activePool !== null && activePool.champions.length >= 1;

  const saveSharedPool = useCallback(() => {
    if (!sharedPool) return;
    setRole(sharedPool.role);
    for (const c of sharedPool.champions) {
      addChampion(c);
    }
    setSharedPool(null);
    window.history.replaceState({}, "", window.location.pathname);
  }, [sharedPool, setRole, addChampion]);

  const dismissSharedPool = useCallback(() => {
    setSharedPool(null);
    setConfirmed(false);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // When role changes, go to dashboard if pool has champions, otherwise picker
  useEffect(() => {
    if (pool?.role !== prevRole.current) {
      prevRole.current = pool?.role;
      if (sharedPool) {
        setSharedPool(null);
        window.history.replaceState({}, "", window.location.pathname);
      }
      setConfirmed(pool !== null && pool.champions.length > 0);
      setSelectedEnemy(null);
    }
  }, [pool?.role, pool?.champions.length, sharedPool]);

  // Back to champion picker when pool is emptied
  useEffect(() => {
    if (confirmed && pool?.champions.length === 0) {
      setConfirmed(false);
    }
  }, [confirmed, pool?.champions.length]);

  useEffect(() => {
    if (!activePool?.role) {
      setChampionsForRole([]);
      return;
    }

    let cancelled = false;
    setChampionsLoading(true);

    fetch(`/api/champions/${activePool.role}`)
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
  }, [activePool?.role]);

  useEffect(() => {
    if (!activePool?.role) {
      setDataset(null);
      return;
    }

    let cancelled = false;
    setMatchupLoading(true);
    setMatchupError(null);

    fetch(`/api/matchups/${activePool.role}?tier=${tier}`)
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
  }, [activePool?.role, tier]);

  const roleChampions = useMemo(
    () => new Set(dataset?.champions ?? []),
    [dataset],
  );

  const opponents = useMemo(() => {
    if (!activePool || !dataset) return [];
    const knownOpponents = new Set<string>();
    for (const m of dataset.matchups) {
      if (
        activePool.champions.includes(m.champion) &&
        roleChampions.has(m.opponent)
      ) {
        knownOpponents.add(m.opponent);
      }
      if (
        activePool.champions.includes(m.opponent) &&
        roleChampions.has(m.champion)
      ) {
        knownOpponents.add(m.champion);
      }
    }
    return [...knownOpponents];
  }, [activePool, dataset, roleChampions]);

  const gaps = useMemo(() => {
    if (!activePool || !dataset) return [];
    return findGaps(activePool.champions, opponents, dataset.matchups);
  }, [activePool, opponents, dataset]);

  const gapOpponents = useMemo(
    () => gaps.filter((g) => g.isGap).map((g) => g.opponent),
    [gaps],
  );

  const suggestions = useMemo(() => {
    if (!activePool || !dataset) return [];
    if (gapOpponents.length > 0) {
      return suggestChampions(
        activePool.champions,
        gapOpponents,
        dataset.matchups,
        dataset.champions,
        gaps,
        dataset.championMeta ?? [],
      );
    }
    return suggestImprovements(
      activePool.champions,
      gaps,
      dataset.matchups,
      dataset.champions,
    );
  }, [activePool, gapOpponents, gaps, dataset]);

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
    if (!activePool || !dataset) return [];
    return activePool.champions
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
  }, [activePool, opponents, dataset]);

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

  const poolScore = useMemo(() => {
    if (gaps.length === 0) return null;
    return computePoolScore(gaps, pickRateMap);
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

  // Keep last rendered enemy detail for collapse animation
  const lastEnemyRef = useRef<{
    enemyId: string;
    pickRate: number | undefined;
    pool: string[];
    matchups: import("@/lib/types").MatchupData[];
    allChampions: string[];
  } | null>(null);
  if (selectedEnemy && dataset) {
    lastEnemyRef.current = {
      enemyId: selectedEnemy,
      pickRate: pickRateMap.get(selectedEnemy),
      pool: activePool?.champions ?? [],
      matchups: dataset.matchups,
      allChampions: championsForRole,
    };
  }

  // Keep last valid analysis data to avoid skeleton flash during role switch
  const stableBlindPicksRef = useRef(blindPicks);
  const stableBanTargetsRef = useRef(banTargets);
  const stableGapsRef = useRef(gaps);
  const stableSuggestionsRef = useRef(suggestions);
  const stableOpponentsRef = useRef(opponents);
  const stablePoolScoreRef = useRef(poolScore);
  const stableDuoRef = useRef<{
    champions: string[];
    duos: import("@/lib/types").DuoData[];
  } | null>(null);
  const hadDuoRef = useRef(false);
  const isStale =
    matchupLoading || (dataset !== null && dataset.role !== activePool?.role);
  if (!isStale && dataset) {
    stableBlindPicksRef.current = blindPicks;
    stableBanTargetsRef.current = banTargets;
    stableGapsRef.current = gaps;
    stableSuggestionsRef.current = suggestions;
    stableOpponentsRef.current = opponents;
    stablePoolScoreRef.current = poolScore;
    const hasDuo =
      (activePool?.role === "bot" || activePool?.role === "support") &&
      !!dataset.duos &&
      dataset.duos.length > 0;
    if (hasDuo) {
      stableDuoRef.current = {
        champions: activePool.champions,
        duos: dataset.duos!,
      };
    } else {
      stableDuoRef.current = null;
    }
    hadDuoRef.current = hasDuo;
  }

  if (!loaded) {
    return <RolePickerSkeleton />;
  }

  if (!activePool?.role) {
    return <RolePicker onSelectRole={handleRoleChange} />;
  }

  const analysisReady = activeIsValid && dataset;
  const dataStale = isStale;

  return (
    <div className="min-h-screen flex flex-col px-4 py-4">
      <div
        className={`max-w-5xl mx-auto w-full ${!confirmed ? "flex flex-col flex-1 gap-6" : "space-y-6"}`}
      >
        <div className="flex items-center justify-center relative">
          {confirmed && (
            <div className="absolute left-0">
              <ShareButton
                role={activePool.role}
                champions={activePool.champions}
                tier={tier}
              />
            </div>
          )}
          {!confirmed && (
            <h1 className="absolute -top-10">
              <Logo size="sm" />
            </h1>
          )}
          <RoleSelector
            role={activePool.role}
            onRoleChange={handleRoleChange}
          />
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

        {sharedPool && confirmed && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-foreground">Viewing a shared pool</span>
            <div className="flex gap-2">
              <button
                onClick={saveSharedPool}
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Save to my pools
              </button>
              <button
                onClick={dismissSharedPool}
                className="text-muted hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!confirmed ? (
          <ChampionPicker
            role={activePool.role}
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
        ) : championsLoading ? (
          <ConfirmedSkeleton championCount={activePool.champions.length} />
        ) : (
          <>
            {!sharedPool && (
              <PoolInput
                role={activePool.role}
                champions={activePool.champions}
                allChampions={championsForRole}
                version={DDRAGON_VERSION}
                onRoleChange={handleRoleChange}
                onAddChampion={addChampion}
                onRemoveChampion={removeChampion}
                compact
                hideRoleSelector
                gradeSlot={
                  stablePoolScoreRef.current ? (
                    <PoolGrade result={stablePoolScoreRef.current} />
                  ) : activePool.champions.length >= 1 ? (
                    <div className="skeleton !rounded-lg w-[53px] h-[30px]" />
                  ) : undefined
                }
              />
            )}

            <div>
              <EnemySearch
                opponents={opponents}
                version={DDRAGON_VERSION}
                selectedEnemy={selectedEnemy}
                onSelectEnemy={setSelectedEnemy}
                connected={!!selectedEnemy}
              />
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  selectedEnemy && analysisReady
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  {lastEnemyRef.current && (
                    <>
                      <EnemyProfile
                        enemyId={lastEnemyRef.current.enemyId}
                        version={DDRAGON_VERSION}
                        pickRate={lastEnemyRef.current.pickRate}
                      />
                      <QuickPick
                        pool={lastEnemyRef.current.pool}
                        selectedEnemy={lastEnemyRef.current.enemyId}
                        matchups={lastEnemyRef.current.matchups}
                        allChampions={lastEnemyRef.current.allChampions}
                        version={DDRAGON_VERSION}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div aria-live="polite">
              {matchupError && (
                <p className="text-loss text-sm">{matchupError}</p>
              )}
            </div>

            {analysisReady ? (
              <div className="bg-card border border-card-border rounded-xl overflow-hidden divide-y divide-card-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
                  <BlindPickBan
                    blindPicks={stableBlindPicksRef.current}
                    version={DDRAGON_VERSION}
                  />
                  <BanTargets
                    targets={stableBanTargetsRef.current}
                    version={DDRAGON_VERSION}
                  />
                </div>
                <div
                  className={`grid ${
                    // Skip animation when switching between bot↔support (both have duos)
                    dataStale &&
                    hadDuoRef.current &&
                    (activePool.role === "bot" || activePool.role === "support")
                      ? "grid-rows-[1fr]"
                      : `transition-[grid-template-rows,border-color] duration-200 ease-in-out ${
                          !dataStale && stableDuoRef.current
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr] !border-transparent"
                        }`
                  }`}
                >
                  <div className="overflow-hidden">
                    {stableDuoRef.current && (
                      <DuoSynergy
                        poolChampions={stableDuoRef.current.champions}
                        duos={stableDuoRef.current.duos}
                        version={DDRAGON_VERSION}
                      />
                    )}
                  </div>
                </div>
                <GapAnalysis
                  gaps={stableGapsRef.current}
                  suggestions={stableSuggestionsRef.current}
                  totalOpponents={stableOpponentsRef.current.length}
                  version={DDRAGON_VERSION}
                  onAddChampion={sharedPool ? undefined : addChampion}
                  canAdd={!sharedPool}
                />
              </div>
            ) : championsLoading || matchupLoading ? (
              <DashboardSkeleton />
            ) : (
              <p className="text-muted text-sm py-8 text-center">
                {!activePool?.role
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
