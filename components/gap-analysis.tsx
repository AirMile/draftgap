"use client";

import type { GapResult, Suggestion } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";

interface GapAnalysisProps {
  gaps: GapResult[];
  suggestions: Suggestion[];
  totalOpponents: number;
  version: string;
}

export function GapAnalysis({
  gaps,
  suggestions,
  totalOpponents,
  version,
}: GapAnalysisProps) {
  const gapCount = gaps.filter((g) => g.isGap).length;
  const covered = totalOpponents - gapCount;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">
          {covered}/{totalOpponents}
        </span>
        <span className="text-muted">matchups gedekt</span>
        {gapCount > 0 && (
          <span className="text-gap font-medium">
            {gapCount} gap{gapCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

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
                <div>
                  <span className="font-medium">{s.champion}</span>
                  <span className="text-muted text-sm ml-2">
                    dicht {s.gapsFixed} gap{s.gapsFixed !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
