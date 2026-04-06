"use client";

import { useState, useRef, useEffect } from "react";
import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface BlindPickBanProps {
  blindPicks: { champion: string; avgWinrate: number }[];
  version: string;
  loading?: boolean;
  selectedChampion: string | null;
  onSelectChampion: (champion: string | null) => void;
}

const COLLAPSED_COUNT = 5;

export function BlindPickBan({
  blindPicks,
  version,
  loading,
  selectedChampion,
  onSelectChampion,
}: BlindPickBanProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortedPick, setSortedPick] = useState<string | null>(null);

  // Collapse when a blind pick is selected, and delay the reorder
  const prevSelected = useRef(selectedChampion);
  if (prevSelected.current !== selectedChampion) {
    prevSelected.current = selectedChampion;
    if (expanded && selectedChampion) setExpanded(false);
  }

  useEffect(() => {
    if (selectedChampion === sortedPick) return;
    const timer = setTimeout(() => setSortedPick(selectedChampion), 200);
    return () => clearTimeout(timer);
  }, [selectedChampion, sortedPick]);

  if (!loading && blindPicks.length === 0) return null;

  // Reorder after delay: selected champion to top
  const sorted = sortedPick
    ? [
        ...blindPicks.filter((p) => p.champion === sortedPick),
        ...blindPicks.filter((p) => p.champion !== sortedPick),
      ]
    : blindPicks;
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hasMore = sorted.length > COLLAPSED_COUNT;

  return (
    <div className="p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Blind pick</span>
        <span
          className="text-[10px] text-muted uppercase tracking-wide cursor-help w-12 text-right"
          title="Overall Win Rate from U.GG"
        >
          WR
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="skeleton w-5 h-5 !rounded-full shrink-0" />
                <div className="skeleton h-3.5 flex-1 max-w-[100px]" />
                <div className="skeleton w-10 h-3.5 ml-auto" />
              </div>
            ))
          : visible.map((pick) => {
              const isSelected = selectedChampion === pick.champion;
              return (
                <button
                  key={pick.champion}
                  onClick={() =>
                    onSelectChampion(isSelected ? null : pick.champion)
                  }
                  className={`group flex items-center gap-2 w-full rounded-md px-1 -mx-1 py-0.5 transition-colors text-left cursor-pointer ${
                    isSelected ? "" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-accent bg-accent"
                        : "border-muted/30 group-hover:border-muted/60"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-background"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <ChampionIcon
                    championId={pick.champion}
                    version={version}
                    size={20}
                  />
                  <span className="text-sm flex-1">
                    {formatChampionName(pick.champion)}
                  </span>
                  <span className="text-xs font-mono text-win w-12 text-right">
                    {pick.avgWinrate.toFixed(1)}%
                  </span>
                </button>
              );
            })}
      </div>
      {hasMore ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-muted hover:text-foreground transition-colors self-start"
        >
          {expanded ? "Show less" : "Show all"}
        </button>
      ) : (
        <div className="mt-2 h-4" />
      )}
    </div>
  );
}
