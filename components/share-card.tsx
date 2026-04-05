import { forwardRef } from "react";
import { formatChampionName } from "@/lib/ui-utils";
import type { Role } from "@/lib/types";

const ROLE_LABELS: Record<Role, string> = {
  top: "TOP",
  jungle: "JUNGLE",
  mid: "MID",
  bot: "BOT",
  support: "SUPPORT",
};

function gradeHex(grade: string): string {
  if (grade === "S" || grade === "A") return "#c89b3c";
  if (grade === "B") return "#22c55e";
  if (grade === "C") return "#eab308";
  return "#f05252";
}

interface ShareCardProps {
  role: Role;
  champions: string[];
  grade: string;
  score: number;
  coveragePct: number;
  avgWinrate: number;
  gapCount: number;
  blindPick: string | null;
  version: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard(
    {
      role,
      champions,
      grade,
      score,
      coveragePct,
      avgWinrate,
      gapCount,
      blindPick,
      version,
    },
    ref,
  ) {
    const color = gradeHex(grade);

    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          height: 630,
          background: "#0f1118",
          border: `2px solid ${color}`,
          borderRadius: 16,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#e2e8f0",
          position: "absolute",
          left: -9999,
          top: -9999,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#8494a7",
                letterSpacing: 2,
              }}
            >
              {ROLE_LABELS[role]} POOL
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 20, color: "#8494a7" }}>{score}/100</span>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: `3px solid ${color}`,
                background: `${color}1a`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color,
              }}
            >
              {grade}
            </div>
          </div>
        </div>

        {/* Champions */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {champions.map((champ) => (
            <div
              key={champ}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ}.png`}
                alt={champ}
                width={96}
                height={96}
                style={{
                  borderRadius: 12,
                  border: "2px solid #2a2d3e",
                }}
              />
              <span style={{ fontSize: 16, color: "#8494a7" }}>
                {formatChampionName(champ)}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
          }}
        >
          <Stat label="Coverage" value={`${coveragePct}%`} />
          <Stat label="Avg WR" value={`${avgWinrate}%`} />
          <Stat label="Gaps" value={String(gapCount)} />
          {blindPick && (
            <Stat label="Best Blind" value={formatChampionName(blindPick)} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: 16,
            color: "#8494a7",
            letterSpacing: 1,
          }}
        >
          lol-pool-optimizer.vercel.app
        </div>
      </div>
    );
  },
);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: "#8494a7",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 600, color: "#e2e8f0" }}>
        {value}
      </span>
    </div>
  );
}
