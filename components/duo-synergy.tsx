"use client";

import type { DuoData } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";
import { winrateColor, formatChampionName } from "@/lib/ui-utils";

interface DuoSynergyProps {
  poolChampions: string[];
  duos: DuoData[];
  version: string;
}

function ChampionDuos({
  champion,
  partners,
  version,
}: {
  champion: string;
  partners: DuoData[];
  version: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <ChampionIcon championId={champion} version={version} size={20} />
        <span className="text-sm font-medium">
          {formatChampionName(champion)}
        </span>
      </div>
      <div className="ml-7 space-y-0.5">
        {partners.map((p) => (
          <div key={p.partner} className="flex items-center gap-2">
            <ChampionIcon championId={p.partner} version={version} size={16} />
            <span className="text-xs flex-1 text-muted">
              {formatChampionName(p.partner)}
            </span>
            <span className={`text-xs font-mono ${winrateColor(p.winrate)}`}>
              {p.winrate.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DuoSynergy({ poolChampions, duos, version }: DuoSynergyProps) {
  const duosByChampion = poolChampions
    .map((champ) => ({
      champion: champ,
      partners: duos
        .filter((d) => d.champion === champ)
        .sort((a, b) => b.winrate - a.winrate)
        .slice(0, 3),
    }))
    .filter((c) => c.partners.length > 0);

  if (duosByChampion.length === 0) return null;

  const mid = Math.ceil(duosByChampion.length / 2);
  const left = duosByChampion.slice(0, mid);
  const right = duosByChampion.slice(mid);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Duo synergy</span>
          <span
            className="text-[10px] text-muted uppercase tracking-wide cursor-help"
            title="Win Rate when paired with this duo partner"
          >
            Duo WR
          </span>
        </div>
        <div className="mt-2 space-y-3">
          {left.map((c) => (
            <ChampionDuos
              key={c.champion}
              champion={c.champion}
              partners={c.partners}
              version={version}
            />
          ))}
        </div>
      </div>
      {right.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-end h-[20px]">
            <span
              className="text-[10px] text-muted uppercase tracking-wide cursor-help"
              title="Win Rate when paired with this duo partner"
            >
              Duo WR
            </span>
          </div>
          <div className="mt-2 space-y-3">
            {right.map((c) => (
              <ChampionDuos
                key={c.champion}
                champion={c.champion}
                partners={c.partners}
                version={version}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
