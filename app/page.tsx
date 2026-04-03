"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePool } from "@/lib/use-pool";
import { PoolInput } from "@/components/pool-input";
import {
  findGaps,
  suggestChampions,
  bestBlindPick,
} from "@/lib/matchup-engine";
import { QuickPick } from "@/components/quick-pick";
import { EnemySearch } from "@/components/enemy-search";
import { BlindPickBan } from "@/components/blind-pick-ban";
import { GapAnalysis } from "@/components/gap-analysis";
import { ChampionIcon } from "@/components/champion-icon";
import type { MatchupDataset, Role } from "@/lib/types";

const DDRAGON_VERSION = "14.10.1";

export default function Home() {
  const { pool, loaded, isValid, setRole, addChampion, removeChampion } =
    usePool();

  const [confirmed, setConfirmed] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
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
      setPickerSelection([]);
    }
  }, [pool?.role]);

  // Back to champion picker when pool is emptied
  useEffect(() => {
    if (confirmed && pool?.champions.length === 0) {
      setPickerSelection([]);
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
        <div className="text-muted">Laden...</div>
      </div>
    );
  }

  if (!pool?.role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
          Pool Optimizer
        </h1>
        <p className="text-muted mb-12 text-sm sm:text-base">
          Selecteer je role om te beginnen
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 w-full max-w-2xl">
          {(
            [
              { value: "top", label: "Top" },
              { value: "jungle", label: "Jungle" },
              { value: "mid", label: "Mid" },
              { value: "bot", label: "Bot" },
              { value: "support", label: "Support" },
            ] as const
          ).map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className="bg-card border border-card-border rounded-xl px-6 py-8 sm:py-10 text-lg font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (pool?.role && !confirmed) {
    const togglePick = (id: string) => {
      setPickerSelection((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
      );
    };

    const handleConfirm = () => {
      for (const c of pickerSelection) {
        addChampion(c);
      }
      setConfirmed(true);
    };

    return (
      <div className="min-h-screen flex flex-col px-4 py-8">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
              Kies je champions
            </h1>
            <div className="flex justify-center gap-1.5">
              {(
                [
                  { value: "top", label: "Top" },
                  { value: "jungle", label: "Jungle" },
                  { value: "mid", label: "Mid" },
                  { value: "bot", label: "Bot" },
                  { value: "support", label: "Support" },
                ] as { value: Role; label: string }[]
              ).map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    pool.role === r.value
                      ? "bg-accent text-background"
                      : "text-muted hover:text-foreground hover:bg-card"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {championsLoading ? (
            <p className="text-muted text-sm text-center py-12">
              Champions laden...
            </p>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3">
              {championsForRole.map((c) => {
                const selected = pickerSelection.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => togglePick(c)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
                      selected
                        ? "bg-accent/20 ring-2 ring-accent"
                        : "hover:bg-card"
                    }`}
                  >
                    <ChampionIcon
                      championId={c}
                      version={DDRAGON_VERSION}
                      size={48}
                    />
                    <span
                      className={`text-[11px] leading-tight truncate w-full text-center ${
                        selected ? "text-accent font-medium" : "text-muted"
                      }`}
                    >
                      {c}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="sticky bottom-0 pt-4 pb-2 mt-auto bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-2">
                {pickerSelection.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-1.5 bg-card border border-card-border rounded-lg px-2 py-1"
                  >
                    <ChampionIcon
                      championId={c}
                      version={DDRAGON_VERSION}
                      size={24}
                    />
                    <span className="text-sm">{c}</span>
                    <button
                      onClick={() => togglePick(c)}
                      className="text-muted hover:text-loss text-sm leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {pickerSelection.length === 0 && (
                  <span className="text-muted text-sm">
                    Geen champions geselecteerd
                  </span>
                )}
              </div>
              <button
                onClick={handleConfirm}
                disabled={pickerSelection.length === 0}
                className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-accent text-background hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Bevestigen ({pickerSelection.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const poolProps = {
    role: pool?.role ?? null,
    champions: pool?.champions ?? [],
    allChampions: championsForRole,
    version: DDRAGON_VERSION,
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
    canAdd: true,
  };

  const analysisReady = isValid && dataset;

  return (
    <div className="min-h-screen flex flex-col px-4 py-4">
      <h1 className="sr-only">LoL Pool Optimizer</h1>

      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-background border border-card-border rounded-lg p-1">
            {(
              [
                { value: "top", label: "Top" },
                { value: "jungle", label: "Jungle" },
                { value: "mid", label: "Mid" },
                { value: "bot", label: "Bot" },
                { value: "support", label: "Support" },
              ] as { value: Role; label: string }[]
            ).map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  pool?.role === r.value
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

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
            pool={pool!.champions}
            selectedEnemy={selectedEnemy}
            matchups={dataset.matchups}
            allChampions={championsForRole}
            version={DDRAGON_VERSION}
          />
        )}

        {analysisReady && (
          <BlindPickBan
            blindPick={blindPick}
            banTarget={banTarget}
            version={DDRAGON_VERSION}
          />
        )}

        <PoolInput {...poolProps} compact hideRoleSelector />

        {championsLoading && (
          <p className="text-muted text-sm">Champions laden...</p>
        )}
        {matchupError && <p className="text-loss text-sm">{matchupError}</p>}
        {isValid && matchupLoading && (
          <p className="text-muted text-sm">Matchup data ophalen...</p>
        )}

        {analysisReady ? (
          <GapAnalysis {...gapProps} />
        ) : (
          !championsLoading &&
          !matchupLoading && (
            <p className="text-muted text-sm py-8 text-center">
              {!pool?.role
                ? "Selecteer een role om te beginnen."
                : "Voeg een champion toe om je matchups te analyseren."}
            </p>
          )
        )}
      </div>
    </div>
  );
}
