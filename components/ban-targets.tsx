"use client";

import { useState, useRef } from "react";
import { ChampionIcon } from "@/components/champion-icon";
import { winrateColor, formatChampionName } from "@/lib/ui-utils";

interface MatchupEntry {
  opponent: string;
  winrate: number;
  pickRate?: number;
}

interface BanTargetsProps {
  version: string;
  blindPickChampion: string;
  blindPickMatchups: MatchupEntry[];
}

const COLLAPSED_COUNT = 5;

export function BanTargets({
  version,
  blindPickChampion,
  blindPickMatchups,
}: BanTargetsProps) {
  const [expanded, setExpanded] = useState(false);

  const prevChampRef = useRef(blindPickChampion);
  if (prevChampRef.current !== blindPickChampion) {
    prevChampRef.current = blindPickChampion;
    if (expanded) setExpanded(false);
  }

  const visible = expanded
    ? blindPickMatchups
    : blindPickMatchups.slice(0, COLLAPSED_COUNT);
  const hasMore = blindPickMatchups.length > COLLAPSED_COUNT;

  return (
    <div className="p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          Ban targets for {formatChampionName(blindPickChampion)}
        </span>
        <div className="flex gap-2">
          <span
            className="text-[10px] text-muted uppercase tracking-wide w-10 text-right cursor-help"
            title="Opponent Pick Rate"
          >
            pick
          </span>
          <span
            className="text-[10px] text-muted uppercase tracking-wide w-12 text-right cursor-help"
            title="Your Win Rate in this matchup"
          >
            WR
          </span>
        </div>
      </div>
      <div
        className={`mt-2 space-y-1 ${expanded ? "max-h-64 overflow-y-auto pr-1" : ""}`}
      >
        {visible.map((m) => (
          <div key={m.opponent} className="flex items-center gap-2 py-0.5">
            <ChampionIcon championId={m.opponent} version={version} size={20} />
            <span className="text-sm flex-1 truncate">
              {formatChampionName(m.opponent)}
            </span>
            {m.pickRate !== undefined && (
              <span className="text-[11px] font-mono text-muted w-10 text-right">
                {m.pickRate.toFixed(1)}%
              </span>
            )}
            <span
              className={`text-xs font-mono font-medium w-12 text-right ${winrateColor(m.winrate)}`}
            >
              {m.winrate.toFixed(1)}%
            </span>
          </div>
        ))}
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
