"use client";

import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface BlindPickBanProps {
  blindPicks: { champion: string; avgWinrate: number }[];
  version: string;
  loading?: boolean;
}

export function BlindPickBan({
  blindPicks,
  version,
  loading,
}: BlindPickBanProps) {
  if (!loading && blindPicks.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Best pool blind picks</span>
        <span
          className="text-[10px] text-muted uppercase tracking-wide cursor-help"
          title="Average Win Rate across all matchups"
        >
          Avg WR
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="skeleton w-4 h-3" />
                <div className="skeleton w-5 h-5 !rounded-full shrink-0" />
                <div className="skeleton h-3.5 flex-1 max-w-[100px]" />
                <div className="skeleton w-10 h-3.5 ml-auto" />
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => {
              const pick = blindPicks[i];
              return pick ? (
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
              ) : (
                <div key={i} className="flex items-center gap-2 invisible">
                  <span className="text-xs w-4">#</span>
                  <div className="w-5 h-5 shrink-0" />
                  <span className="text-sm flex-1">—</span>
                  <span className="text-xs w-10">—</span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
