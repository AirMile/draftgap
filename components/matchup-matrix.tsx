"use client";

import { useState, useMemo } from "react";
import type { MatchupData } from "@/lib/types";
import { bestPick } from "@/lib/matchup-engine";
import { winrateColor, winrateBg } from "@/lib/ui-utils";
import { ChampionIcon } from "@/components/champion-icon";

type SortMode = "hardest" | "easiest" | "alpha";
type FilterMode = "all" | "gaps" | "unfavorable";

interface MatchupMatrixProps {
  pool: string[];
  opponents: string[];
  matchups: MatchupData[];
  gapOpponents: string[];
  version: string;
}

function getBestWinrate(
  pool: string[],
  opponent: string,
  matchups: MatchupData[],
): number {
  let best = 0;
  for (const champ of pool) {
    const mu = matchups.find(
      (m) =>
        (m.champion === champ && m.opponent === opponent) ||
        (m.champion === opponent && m.opponent === champ),
    );
    if (!mu) continue;
    const wr =
      mu.champion === champ
        ? mu.winrate
        : Math.round((100 - mu.winrate) * 10) / 10;
    if (wr > best) best = wr;
  }
  return best;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "hardest", label: "Hardest" },
  { value: "easiest", label: "Easiest" },
  { value: "alpha", label: "A-Z" },
];

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gaps", label: "Gaps" },
  { value: "unfavorable", label: "<50%" },
];

export function MatchupMatrix({
  pool,
  opponents,
  matchups,
  gapOpponents,
  version,
}: MatchupMatrixProps) {
  const [sort, setSort] = useState<SortMode>("hardest");
  const [filter, setFilter] = useState<FilterMode>("all");

  const bestWinrates = useMemo(() => {
    const map = new Map<string, number>();
    for (const opp of opponents) {
      map.set(opp, getBestWinrate(pool, opp, matchups));
    }
    return map;
  }, [pool, opponents, matchups]);

  const filtered = useMemo(() => {
    let result = [...opponents];

    if (filter === "gaps") {
      result = result.filter((opp) => gapOpponents.includes(opp));
    } else if (filter === "unfavorable") {
      result = result.filter((opp) => (bestWinrates.get(opp) ?? 0) < 50);
    }

    if (sort === "hardest") {
      result.sort(
        (a, b) => (bestWinrates.get(a) ?? 0) - (bestWinrates.get(b) ?? 0),
      );
    } else if (sort === "easiest") {
      result.sort(
        (a, b) => (bestWinrates.get(b) ?? 0) - (bestWinrates.get(a) ?? 0),
      );
    } else {
      result.sort((a, b) => a.localeCompare(b));
    }

    return result;
  }, [opponents, filter, sort, gapOpponents, bestWinrates]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-muted text-xs">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sort === opt.value
                  ? "bg-accent text-background"
                  : "bg-card border border-card-border text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted text-xs">Filter:</span>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-accent text-background"
                  : "bg-card border border-card-border text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="text-muted text-xs ml-1">
            {filtered.length}/{opponents.length}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background z-10 px-3 py-2 text-left text-muted font-medium">
                vs
              </th>
              {pool.map((champ) => (
                <th key={champ} className="px-2 py-2 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <ChampionIcon
                      championId={champ}
                      version={version}
                      size={28}
                    />
                    <span className="text-xs truncate max-w-[56px]">
                      {champ}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((opp) => {
              const isGap = gapOpponents.includes(opp);
              return (
                <tr
                  key={opp}
                  className={`border-t border-card-border ${isGap ? "bg-loss/5" : ""}`}
                >
                  <td className="sticky left-0 bg-background z-10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ChampionIcon
                        championId={opp}
                        version={version}
                        size={28}
                      />
                      <span
                        className={`font-medium ${isGap ? "text-gap" : ""}`}
                      >
                        {opp}
                      </span>
                    </div>
                  </td>
                  {pool.map((champ) => {
                    const mu = matchups.find(
                      (m) => m.champion === champ && m.opponent === opp,
                    );
                    const isBest = bestPick(pool, opp, matchups) === champ;
                    const wr = mu?.winrate ?? 0;

                    return (
                      <td
                        key={champ}
                        className={`px-2 py-2 text-center ${mu ? winrateBg(wr) : ""} ${
                          isBest ? "ring-2 ring-accent ring-inset rounded" : ""
                        }`}
                      >
                        {mu ? (
                          <span
                            className={`font-mono text-sm font-medium ${winrateColor(wr)}`}
                          >
                            {wr.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
