"use client";

import championInfoData from "@/data/champion-info.json";
import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface ChampionInfo {
  id: string;
  attackType: string;
  roles: string[];
  damageTypes: string[];
  traits: string[];
  cc: string[];
}

const championMap = new Map<string, ChampionInfo>(
  (championInfoData as ChampionInfo[]).map((c) => [c.id, c]),
);

const ROLE_LABELS: Record<string, string> = {
  FIGHTER: "Fighter",
  JUGGERNAUT: "Juggernaut",
  TANK: "Tank",
  MAGE: "Mage",
  ASSASSIN: "Assassin",
  MARKSMAN: "Marksman",
  SUPPORT: "Support",
  BURST: "Burst",
  ENCHANTER: "Enchanter",
  SPECIALIST: "Specialist",
  ARTILLERY: "Artillery",
  BATTLEMAGE: "Battlemage",
  CATCHER: "Catcher",
  DIVER: "Diver",
  SKIRMISHER: "Skirmisher",
  VANGUARD: "Vanguard",
  WARDEN: "Warden",
};

function deriveItemTips(info: ChampionInfo): string[] {
  const tips: string[] = [];

  if (info.damageTypes.includes("AD") && !info.damageTypes.includes("AP")) {
    tips.push("Armor");
  } else if (
    info.damageTypes.includes("AP") &&
    !info.damageTypes.includes("AD")
  ) {
    tips.push("Magic resistance");
  } else if (
    info.damageTypes.includes("AD") &&
    info.damageTypes.includes("AP")
  ) {
    tips.push("Mixed resistance");
  }

  if (info.traits.includes("True dmg")) tips.push("Health");
  if (info.traits.includes("Sustain")) tips.push("Anti-heal");
  if (info.traits.includes("%HP dmg")) tips.push("Resistance > health");
  if (info.cc.length >= 2) tips.push("Tenacity");

  if (info.id === "Nasus") tips.push("Swiftness boots");

  return tips;
}

interface EnemyProfileProps {
  enemyId: string;
  version: string;
  pickRate?: number;
}

export function EnemyProfile({
  enemyId,
  version,
  pickRate,
}: EnemyProfileProps) {
  const info = championMap.get(enemyId);
  if (!info) return null;

  const tips = deriveItemTips(info);

  return (
    <div className="bg-card border-x border-card-border px-4 py-4">
      <div className="flex items-start gap-4">
        <ChampionIcon championId={enemyId} version={version} size={72} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">
              {formatChampionName(enemyId)}
            </span>
            {info.damageTypes.map((dt) => (
              <span
                key={dt}
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  dt === "AD"
                    ? "bg-red-500/15 text-red-400"
                    : dt === "AP"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-white/10 text-white"
                }`}
              >
                {dt}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
            <span>{info.attackType === "MELEE" ? "Melee" : "Ranged"}</span>
            <span>·</span>
            <span>
              {info.roles
                .slice(0, 3)
                .map((r) => ROLE_LABELS[r] ?? r)
                .join(", ")}
            </span>
            {pickRate !== undefined && (
              <>
                <span>·</span>
                <span>{pickRate.toFixed(1)}% pick rate</span>
              </>
            )}
          </div>

          {(info.traits.length > 0 || info.cc.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {info.traits.map((t) => (
                <span
                  key={t}
                  className="text-xs text-muted bg-white/5 rounded px-1.5 py-0.5"
                >
                  {t}
                </span>
              ))}
              {info.cc.map((c) => (
                <span
                  key={c}
                  className="text-xs text-muted bg-white/5 rounded px-1.5 py-0.5"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {tips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <span className="text-xs text-muted">Build:</span>
          {tips.map((tip) => (
            <span
              key={tip}
              className="text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-md px-2 py-0.5"
            >
              {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
