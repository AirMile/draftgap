"use client";

import { useState } from "react";
import type { GapResult, Suggestion } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName, winrateColor } from "@/lib/ui-utils";

interface GapAnalysisProps {
  gaps: GapResult[];
  suggestions: Suggestion[];
  totalOpponents: number;
  version: string;
  onAddChampion?: (id: string) => void;
  canAdd?: boolean;
  loading?: boolean;
}

export function GapAnalysis({
  gaps,
  suggestions,
  totalOpponents,
  version,
  onAddChampion,
  canAdd,
  loading,
}: GapAnalysisProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAllWorst, setShowAllWorst] = useState(false);
  const gapList = gaps.filter((g) => g.isGap);
  const hasGaps = gapList.length > 0;
  const covered = totalOpponents - gapList.length;
  const allWorstMatchups = [...gaps].sort(
    (a, b) => a.bestWinrate - b.bestWinrate,
  );
  // Show enough items to roughly match suggestions height (min 5, default 7)
  const defaultCount = Math.max(5, Math.min(7, allWorstMatchups.length));
  const worstMatchups = showAllWorst
    ? allWorstMatchups
    : allWorstMatchups.slice(0, defaultCount);
  const hasMoreWorst = allWorstMatchups.length > defaultCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Weakest pool matchups</span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] text-muted uppercase tracking-wide w-10 text-right cursor-help"
              title="Pick Rate — how often this champion is picked"
            >
              pick
            </span>
            <div className="w-4 shrink-0" />
            <span
              className="text-[10px] text-muted uppercase tracking-wide w-10 text-right cursor-help"
              title="Best Win Rate from your pool against this opponent"
            >
              Best WR
            </span>
          </div>
        </div>
        <div className="mt-2 divide-y divide-card-border">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <div className="skeleton w-5 h-5 !rounded-full shrink-0" />
                  <div className="skeleton h-3.5 flex-1 max-w-[100px]" />
                  <div className="skeleton w-4 h-4 !rounded-full shrink-0" />
                  <div className="skeleton w-10 h-3.5" />
                  <div className="skeleton w-10 h-3.5" />
                </div>
              ))
            : worstMatchups.map((g) => (
                <div
                  key={g.opponent}
                  className="flex items-center gap-2 py-1.5"
                >
                  <ChampionIcon
                    championId={g.opponent}
                    version={version}
                    size={20}
                  />
                  <span className="text-sm flex-1">
                    {formatChampionName(g.opponent)}
                  </span>
                  <span className="text-[11px] font-mono text-muted w-10 text-right">
                    {g.pickRate > 0 ? `${g.pickRate.toFixed(1)}%` : "—"}
                  </span>
                  <div className="flex items-center gap-1.5 ml-1">
                    {g.bestChampion && (
                      <ChampionIcon
                        championId={g.bestChampion}
                        version={version}
                        size={18}
                      />
                    )}
                    <span
                      className={`text-xs font-mono w-10 text-right ${g.isGap ? "text-loss" : g.bestWinrate < 50 ? "text-loss" : "text-neutral"}`}
                    >
                      {g.bestWinrate > 0 ? `${g.bestWinrate.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>
              ))}
        </div>
        {hasMoreWorst && (
          <button
            onClick={() => setShowAllWorst(!showAllWorst)}
            className="mt-2 text-xs text-muted hover:text-foreground transition-colors"
          >
            {showAllWorst ? "Show less" : "Show all"}
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Pool suggestions</span>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-1">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                  <div className="skeleton w-5 h-5 !rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="skeleton h-3.5 w-20" />
                    <div className="skeleton h-2.5 w-28" />
                  </div>
                  <div className="skeleton w-7 h-7 !rounded-md" />
                </div>
              ))
            : suggestions.map((s) => {
                const isExpanded = expanded === s.champion;
                return (
                  <div
                    key={s.champion}
                    className="rounded-md transition-all duration-150"
                  >
                    <div className="relative group/suggestion">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(isExpanded ? null : s.champion)
                        }
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5 rounded-md w-full min-w-0 text-left"
                        aria-expanded={isExpanded}
                      >
                        <ChampionIcon
                          championId={s.champion}
                          version={version}
                          size={20}
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm truncate">
                            {formatChampionName(s.champion)}
                          </div>
                          <div className="text-muted text-xs">
                            {`improves ${s.matchups.length} matchup${s.matchups.length !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                      </button>
                      {onAddChampion && canAdd && (
                        <button
                          onClick={() => onAddChampion(s.champion)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted border border-card-border group-hover/suggestion:text-accent group-hover/suggestion:border-accent/30 hover:!bg-accent/10 transition-colors shrink-0 text-lg leading-none w-7 h-7 flex items-center justify-center rounded-md z-10"
                          aria-label={`Add ${formatChampionName(s.champion)} to pool`}
                        >
                          +
                        </button>
                      )}
                    </div>
                    {isExpanded && s.matchups.length > 0 && (
                      <div className="px-2 pb-2 pt-1 ml-7 divide-y divide-card-border/50">
                        {[...s.matchups]
                          .sort((a, b) => {
                            const gA = gaps.find(
                              (g) => g.opponent === a.opponent,
                            );
                            const gB = gaps.find(
                              (g) => g.opponent === b.opponent,
                            );
                            return (
                              (gA?.bestWinrate ?? 0) - (gB?.bestWinrate ?? 0)
                            );
                          })
                          .map((m) => {
                            const current = gaps.find(
                              (g) => g.opponent === m.opponent,
                            );
                            const currentWr = current?.bestWinrate ?? 0;
                            const stillLosing = m.winrate < 50;
                            return (
                              <div
                                key={`${m.champion}-${m.opponent}`}
                                className="flex items-center gap-2 text-xs py-1.5"
                              >
                                <span className="text-muted">vs</span>
                                <ChampionIcon
                                  championId={m.opponent}
                                  version={version}
                                  size={16}
                                />
                                <span className="flex-1">
                                  {formatChampionName(m.opponent)}
                                </span>
                                {current && (
                                  <span className="font-mono text-xs text-muted">
                                    {currentWr.toFixed(1)}%
                                  </span>
                                )}
                                <span className="text-muted text-xs">→</span>
                                <span
                                  className={`font-mono font-medium ${stillLosing ? "text-neutral" : winrateColor(m.winrate)}`}
                                >
                                  {m.winrate.toFixed(1)}%
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
