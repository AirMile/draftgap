"use client";

import type { MatchupData } from "@/lib/types";
import { rankPoolVsEnemy } from "@/lib/matchup-engine";
import { winrateColor, formatChampionName } from "@/lib/ui-utils";
import { ChampionIcon } from "@/components/champion-icon";

interface QuickPickProps {
  pool: string[];
  selectedEnemy: string | null;
  matchups: MatchupData[];
  allChampions: string[];
  version: string;
}

export function QuickPick({
  pool,
  selectedEnemy,
  matchups,
  allChampions,
  version,
}: QuickPickProps) {
  if (!selectedEnemy) return null;

  const poolWithData = rankPoolVsEnemy(pool, selectedEnemy, matchups).filter(
    (m) => m.champion !== selectedEnemy,
  );

  const poolWithDataSet = new Set(poolWithData.map((m) => m.champion));
  const poolNoData = pool.filter(
    (c) => !poolWithDataSet.has(c) && c !== selectedEnemy,
  );

  const topCounters = rankPoolVsEnemy(
    allChampions.filter((c) => !pool.includes(c)),
    selectedEnemy,
    matchups,
  ).slice(0, 5);

  return (
    <div className="bg-card border border-card-border border-t-0 rounded-b-xl">
      {/* Pool ranking + Top counters */}
      <div className="border-t border-card-border grid grid-cols-1 sm:grid-cols-2">
        <div className="p-4">
          <h3 className="text-xs text-muted mb-3">
            Your pool vs {formatChampionName(selectedEnemy)}
          </h3>
          {poolWithData.length > 0 || poolNoData.length > 0 ? (
            <div className="space-y-2">
              {poolWithData.map((m, i) => (
                <div key={m.champion} className="flex items-center gap-2">
                  <span className="text-muted text-xs w-5 tabular-nums">
                    #{i + 1}
                  </span>
                  <ChampionIcon
                    championId={m.champion}
                    version={version}
                    size={20}
                  />
                  <span className="text-sm flex-1">
                    {formatChampionName(m.champion)}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium ${winrateColor(m.winrate)}`}
                  >
                    {m.winrate.toFixed(1)}%
                  </span>
                </div>
              ))}
              {poolNoData.map((c) => (
                <div key={c} className="flex items-center gap-2 opacity-40">
                  <span className="text-muted text-xs w-5">—</span>
                  <ChampionIcon championId={c} version={version} size={20} />
                  <span className="text-sm flex-1">
                    {formatChampionName(c)}
                  </span>
                  <span className="text-muted text-xs">no data</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No data available</p>
          )}
        </div>

        <div className="p-4 sm:border-l sm:border-card-border">
          <h3 className="text-xs text-muted mb-3">Top counters</h3>
          {topCounters.length > 0 ? (
            <div className="space-y-2">
              {topCounters.map((m, i) => (
                <div key={m.champion} className="flex items-center gap-2">
                  <span className="text-muted text-xs w-5 tabular-nums">
                    #{i + 1}
                  </span>
                  <ChampionIcon
                    championId={m.champion}
                    version={version}
                    size={20}
                  />
                  <span className="text-sm flex-1">
                    {formatChampionName(m.champion)}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium ${winrateColor(m.winrate)}`}
                  >
                    {m.winrate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
