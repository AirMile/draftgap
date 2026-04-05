"use client";

import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface BanTarget {
  champion: string;
  pickRate: number;
  bestWinrate: number;
}

interface BanTargetsProps {
  targets: BanTarget[];
  version: string;
  loading?: boolean;
}

export function BanTargets({ targets, version, loading }: BanTargetsProps) {
  if (!loading && targets.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Pool ban targets</span>
        <div className="flex gap-2">
          <span
            className="text-[10px] text-muted uppercase tracking-wide w-12 text-right cursor-help"
            title="Pick Rate — how often this champion is picked"
          >
            pick
          </span>
          <span
            className="text-[10px] text-muted uppercase tracking-wide w-12 text-right cursor-help"
            title="Win Rate against your best pool counter"
          >
            vs best
          </span>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="skeleton w-4 h-3" />
                <div className="skeleton w-5 h-5 !rounded-full shrink-0" />
                <div className="skeleton h-3.5 flex-1 max-w-[100px]" />
                <div className="flex shrink-0 gap-2 ml-auto">
                  <div className="skeleton w-10 h-3.5" />
                  <div className="skeleton w-10 h-3.5" />
                </div>
              </div>
            ))
          : targets.map((t, i) => (
              <div key={t.champion} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4">#{i + 1}</span>
                <ChampionIcon
                  championId={t.champion}
                  version={version}
                  size={20}
                />
                <span className="text-sm flex-1">
                  {formatChampionName(t.champion)}
                </span>
                <div className="flex shrink-0 gap-2">
                  <span className="text-xs font-mono text-muted w-12 text-right">
                    {t.pickRate.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono text-loss w-12 text-right">
                    {(100 - t.bestWinrate).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
