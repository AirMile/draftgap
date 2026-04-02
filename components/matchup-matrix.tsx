"use client";

import type { MatchupData } from "@/lib/types";
import { bestPick } from "@/lib/matchup-engine";
import { ChampionIcon } from "@/components/champion-icon";

interface MatchupMatrixProps {
  pool: string[];
  opponents: string[];
  matchups: MatchupData[];
  gapOpponents: string[];
  version: string;
}

function winrateColor(wr: number): string {
  if (wr >= 52) return "text-win";
  if (wr > 48) return "text-neutral";
  return "text-loss";
}

function winrateBg(wr: number): string {
  if (wr >= 52) return "bg-win/10";
  if (wr > 48) return "bg-neutral/10";
  return "bg-loss/10";
}

export function MatchupMatrix({
  pool,
  opponents,
  matchups,
  gapOpponents,
  version,
}: MatchupMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-background z-10 px-3 py-2 text-left text-muted font-medium">
              Pool
            </th>
            {opponents.map((opp) => {
              const isGap = gapOpponents.includes(opp);
              return (
                <th
                  key={opp}
                  className={`px-2 py-2 text-center font-medium min-w-[60px] ${
                    isGap ? "text-gap" : "text-muted"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <ChampionIcon
                      championId={opp}
                      version={version}
                      size={28}
                    />
                    <span className="text-xs truncate max-w-[56px]">{opp}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {pool.map((champ) => (
            <tr key={champ} className="border-t border-card-border">
              <td className="sticky left-0 bg-background z-10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <ChampionIcon
                    championId={champ}
                    version={version}
                    size={28}
                  />
                  <span className="font-medium">{champ}</span>
                </div>
              </td>
              {opponents.map((opp) => {
                const mu = matchups.find(
                  (m) => m.champion === champ && m.opponent === opp,
                );
                const isBest = bestPick(pool, opp, matchups) === champ;
                const wr = mu?.winrate ?? 0;

                return (
                  <td
                    key={opp}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
