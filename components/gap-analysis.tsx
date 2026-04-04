"use client";

import type { GapResult, Suggestion } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";

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
                  <span className="text-sm flex-1">{g.opponent}</span>
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
                const isClickable = onAddChampion && canAdd;
                const Wrapper = isClickable ? "button" : "div";
                return (
                  <Wrapper
                    key={s.champion}
                    {...(isClickable
                      ? { onClick: () => onAddChampion(s.champion) }
                      : {})}
                    className={`flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-2 transition-all duration-150 ${
                      isClickable
                        ? "cursor-pointer hover:border-accent/50 hover:bg-accent/5 active:scale-[0.98] group"
                        : ""
                    }`}
                  >
                    <ChampionIcon
                      championId={s.champion}
                      version={version}
                      size={24}
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">
                        {s.champion}
                      </div>
                      <div className="text-muted text-xs">
                        {`covers ${s.gapsFixed} weak matchup${s.gapsFixed !== 1 ? "s" : ""}`}
                      </div>
                    </div>
                    {isClickable && (
                      <span className="text-muted group-hover:text-accent transition-colors shrink-0 text-lg leading-none">
                        +
                      </span>
                    )}
                  </Wrapper>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
