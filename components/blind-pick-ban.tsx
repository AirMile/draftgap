"use client";

import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface BlindPickBanProps {
  blindPicks: { champion: string; avgWinrate: number }[];
  version: string;
}

export function BlindPickBan({ blindPicks, version }: BlindPickBanProps) {
  if (blindPicks.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Best pool blind picks</span>
        <span
          className="text-[10px] text-muted/60 uppercase tracking-wide cursor-help"
          title="Average Win Rate across all matchups"
        >
          Avg WR
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {blindPicks.map((pick, i) => (
          <div key={pick.champion} className="flex items-center gap-2">
            <span className="text-xs text-muted w-4">#{i + 1}</span>
            <ChampionIcon
              championId={pick.champion}
              version={version}
              size={20}
            />
            <span className="text-sm flex-1">
              {formatChampionName(pick.champion)}
            </span>
            <span className="text-xs font-mono text-win">
              {pick.avgWinrate.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
