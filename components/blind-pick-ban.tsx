"use client";

import { ChampionIcon } from "@/components/champion-icon";

interface BlindPickBanProps {
  blindPick: { champion: string; avgWinrate: number } | null;
  banTarget: { opponent: string; bestWinrate: number } | null;
  version: string;
}

export function BlindPickBan({
  blindPick,
  banTarget,
  version,
}: BlindPickBanProps) {
  if (!blindPick && !banTarget) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {blindPick && (
        <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
          <ChampionIcon
            championId={blindPick.champion}
            version={version}
            size={32}
          />
          <div>
            <span className="text-xs text-muted">Blind pick</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{blindPick.champion}</span>
              <span className="text-xs font-mono text-win">
                {blindPick.avgWinrate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      {banTarget && (
        <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
          <ChampionIcon
            championId={banTarget.opponent}
            version={version}
            size={32}
          />
          <div>
            <span className="text-xs text-muted">Best ban</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{banTarget.opponent}</span>
              <span className="text-xs font-mono text-loss">
                {banTarget.bestWinrate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
