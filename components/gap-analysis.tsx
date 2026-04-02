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

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-bold">
          {covered}/{totalOpponents}
        </span>
        <span className="text-muted">matchups gedekt</span>
        {gapList.length > 0 && (
          <span className="text-gap font-medium">
            {gapList.length} gap{gapList.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {gapList.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted">Gaps tegen:</span>
          {gapList.map((g) => (
            <div
              key={g.opponent}
              className="flex items-center gap-1.5 bg-card border border-loss/30 rounded-md px-2 py-1"
            >
              <ChampionIcon
                championId={g.opponent}
                version={version}
                size={20}
              />
              <span className="text-sm">{g.opponent}</span>
              <span className="text-loss text-xs font-mono">
                {g.bestWinrate > 0 ? `${g.bestWinrate.toFixed(1)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted mb-3">
            Suggesties om gaps te dichten
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <div
                key={s.champion}
                className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-3"
              >
                <ChampionIcon
                  championId={s.champion}
                  version={version}
                  size={32}
                />
                <div className="flex-1">
                  <span className="font-medium">{s.champion}</span>
                  <span className="text-muted text-sm ml-2">
                    dicht {s.gapsFixed} gap{s.gapsFixed !== 1 ? "s" : ""}
                  </span>
                </div>
                {onAddChampion && canAdd && (
                  <button
                    onClick={() => onAddChampion(s.champion)}
                    className="px-3 py-1 bg-accent text-background rounded-md text-sm font-medium hover:bg-accent-dim transition-colors cursor-pointer"
                  >
                    + Pool
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
