"use client";

import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface BlindPickBanProps {
  blindPicks: { champion: string; avgWinrate: number }[];
  banTargets: { opponent: string; bestWinrate: number; pickRate?: number }[];
  version: string;
}

export function BlindPickBan({
  blindPicks,
  banTargets,
  version,
}: BlindPickBanProps) {
  if (blindPicks.length === 0 && banTargets.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {blindPicks.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <span className="text-xs text-muted">Blind pick</span>
          <div className="mt-1 space-y-1">
            {blindPicks.map((pick, i) => (
              <div key={pick.champion} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4">#{i + 1}</span>
                <ChampionIcon
                  championId={pick.champion}
                  version={version}
                  size={i === 0 ? 24 : 20}
                />
                <span
                  className={`flex-1 ${i === 0 ? "text-sm font-medium" : "text-xs text-muted"}`}
                >
                  {formatChampionName(pick.champion)}
                </span>
                <span className="text-xs font-mono text-win">
                  {pick.avgWinrate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {banTargets.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <span className="text-xs text-muted">Ban priority</span>
          <div className="mt-1 space-y-1">
            {banTargets.map((ban, i) => (
              <div key={ban.opponent} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4">#{i + 1}</span>
                <ChampionIcon
                  championId={ban.opponent}
                  version={version}
                  size={i === 0 ? 24 : 20}
                />
                <span
                  className={`flex-1 ${i === 0 ? "text-sm font-medium" : "text-xs text-muted"}`}
                >
                  {formatChampionName(ban.opponent)}
                </span>
                {ban.pickRate != null && (
                  <span className="text-xs font-mono text-muted">
                    {ban.pickRate.toFixed(1)}%
                  </span>
                )}
                <span className="text-xs font-mono text-loss">
                  {ban.bestWinrate.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
