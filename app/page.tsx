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
    setDataset(null);
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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!activePool?.role) {
    return <RolePicker onSelectRole={setRole} />;
  }

  const analysisReady = activeIsValid && dataset;

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
          <RoleSelector role={activePool.role} onRoleChange={setRole} />
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
        ) : (
          <>
            {!sharedPool && (
              <PoolInput
                role={activePool.role}
                champions={activePool.champions}
                allChampions={championsForRole}
                version={DDRAGON_VERSION}
                onRoleChange={setRole}
                onAddChampion={addChampion}
                onRemoveChampion={removeChampion}
                compact
                hideRoleSelector
                gradeSlot={
                  poolScore ? <PoolGrade result={poolScore} /> : undefined
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
              {selectedEnemy && analysisReady && (
                <>
                  <EnemyProfile
                    enemyId={selectedEnemy}
                    version={DDRAGON_VERSION}
                    pickRate={pickRateMap.get(selectedEnemy)}
                  />
                  <QuickPick
                    pool={activePool.champions}
                    selectedEnemy={selectedEnemy}
                    matchups={dataset.matchups}
                    allChampions={championsForRole}
                    version={DDRAGON_VERSION}
                  />
                </>
              )}
            </div>

            <div aria-live="polite">
              {matchupError && (
                <p className="text-loss text-sm">{matchupError}</p>
              )}
            </div>

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
                {(activePool.role === "bot" || activePool.role === "support") &&
                  dataset.duos &&
                  dataset.duos.length > 0 && (
                    <DuoSynergy
                      poolChampions={activePool.champions}
                      duos={dataset.duos}
                      version={DDRAGON_VERSION}
                    />
                  )}
                <GapAnalysis
                  gaps={gaps}
                  suggestions={suggestions}
                  totalOpponents={opponents.length}
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
