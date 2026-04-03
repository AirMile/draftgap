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
            <div className="mt-2 space-y-1">
              {worstMatchups.map((g) => (
                <div key={g.opponent} className="flex items-center gap-2">
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
              Beste suggesties
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {suggestions.map((s) => (
                <div
                  key={s.champion}
                  className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-2"
                >
                  <ChampionIcon
                    championId={s.champion}
                    version={version}
                    size={24}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {s.champion}
                    </div>
                    <div className="text-muted text-xs">
                      {s.gapsFixed} gap{s.gapsFixed !== 1 ? "s" : ""} gedicht
                    </div>
                  </div>
                  {onAddChampion && canAdd && (
                    <button
                      onClick={() => onAddChampion(s.champion)}
                      className="px-2.5 py-1.5 bg-accent text-background rounded-md text-sm font-medium hover:bg-accent-dim transition-colors cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
