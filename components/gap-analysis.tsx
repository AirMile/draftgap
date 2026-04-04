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
}

export function GapAnalysis({
  gaps,
  suggestions,
  totalOpponents,
  version,
  onAddChampion,
  canAdd,
}: GapAnalysisProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const gapList = gaps.filter((g) => g.isGap);
  const hasGaps = gapList.length > 0;
  const covered = totalOpponents - gapList.length;
  const worstMatchups = [...gaps]
    .sort((a, b) => a.bestWinrate - b.bestWinrate)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {worstMatchups.length > 0 && (
          <div className="bg-card border border-card-border rounded-lg p-4">
            <span className="text-sm text-muted">Worst matchups</span>
            <div className="mt-2 divide-y divide-card-border">
              {worstMatchups.map((g) => (
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
                  {g.bestChampion && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <ChampionIcon
                        championId={g.bestChampion}
                        version={version}
                        size={16}
                      />
                    </span>
                  )}
                  <span
                    className={`text-xs font-mono ${g.isGap ? "text-loss" : g.bestWinrate < 50 ? "text-loss" : "text-neutral"}`}
                  >
                    {g.bestWinrate > 0 ? `${g.bestWinrate.toFixed(1)}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted mb-3">
              Pool suggestions
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {suggestions.map((s) => {
                const isExpanded = expanded === s.champion;
                return (
                  <div
                    key={s.champion}
                    className="bg-card border border-card-border rounded-lg transition-all duration-150"
                  >
                    <div
                      onClick={() =>
                        setExpanded(isExpanded ? null : s.champion)
                      }
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/5 rounded-lg"
                    >
                      <ChampionIcon
                        championId={s.champion}
                        version={version}
                        size={24}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">
                          {formatChampionName(s.champion)}
                        </div>
                        <div className="text-muted text-xs">
                          {`covers ${s.gapsFixed} weak matchup${s.gapsFixed !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                      {onAddChampion && canAdd && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddChampion(s.champion);
                          }}
                          className="text-muted hover:text-accent hover:bg-accent/10 transition-colors shrink-0 text-lg leading-none w-8 h-8 flex items-center justify-center rounded-md"
                        >
                          +
                        </button>
                      )}
                    </div>
                    {isExpanded && s.matchups.length > 0 && (
                      <div className="px-3 pb-2 pt-1 border-t border-card-border divide-y divide-card-border">
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
                                    {current.bestWinrate.toFixed(1)}%
                                  </span>
                                )}
                                <span className="text-muted text-xs">→</span>
                                <span
                                  className={`font-mono font-medium ${winrateColor(m.winrate)}`}
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
        )}
      </div>
    </div>
  );
}
