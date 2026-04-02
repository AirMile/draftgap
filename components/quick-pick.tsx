"use client";

import { useState, useRef, useEffect } from "react";
import type { MatchupData } from "@/lib/types";
import { rankPoolVsEnemy } from "@/lib/matchup-engine";
import { ChampionIcon } from "@/components/champion-icon";

interface QuickPickProps {
  pool: string[];
  opponents: string[];
  matchups: MatchupData[];
  allChampions: string[];
  version: string;
}

function winrateColor(wr: number): string {
  if (wr >= 52) return "text-win";
  if (wr > 48) return "text-neutral";
  return "text-loss";
}

export function QuickPick({
  pool,
  opponents,
  matchups,
  allChampions,
  version,
}: QuickPickProps) {
  const [query, setQuery] = useState("");
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = opponents
    .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const poolWithData = selectedEnemy
    ? rankPoolVsEnemy(pool, selectedEnemy, matchups)
    : [];

  const poolWithDataSet = new Set(poolWithData.map((m) => m.champion));
  const poolNoData = selectedEnemy
    ? pool.filter((c) => !poolWithDataSet.has(c))
    : [];

  const topCounters = selectedEnemy
    ? rankPoolVsEnemy(
        allChampions.filter((c) => !pool.includes(c)),
        selectedEnemy,
        matchups,
      ).slice(0, 3)
    : [];

  const bestPoolWr = poolWithData.length > 0 ? poolWithData[0].winrate : 0;
  const betterCounters = topCounters.filter((c) => c.winrate > bestPoolWr);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedEnemy ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedEnemy(null);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!selectedEnemy) setIsOpen(true);
          }}
          placeholder="Tegen wie speel je?"
          className="w-full bg-card border border-card-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent text-lg"
        />
        {selectedEnemy && (
          <button
            onClick={() => {
              setSelectedEnemy(null);
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            ×
          </button>
        )}
        {isOpen && !selectedEnemy && filtered.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-card-border rounded-lg overflow-hidden z-20 max-h-64 overflow-y-auto"
          >
            {filtered.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedEnemy(c);
                  setQuery("");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-card-border text-left transition-colors"
              >
                <ChampionIcon championId={c} version={version} size={24} />
                <span>{c}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEnemy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted mb-3">
              Jouw pool vs {selectedEnemy}
            </h3>
            {poolWithData.length > 0 || poolNoData.length > 0 ? (
              <div className="space-y-2">
                {poolWithData.map((m, i) => (
                  <div key={m.champion} className="flex items-center gap-3">
                    <span className="text-muted text-sm w-5">#{i + 1}</span>
                    <ChampionIcon
                      championId={m.champion}
                      version={version}
                      size={24}
                    />
                    <span className="flex-1">{m.champion}</span>
                    <span
                      className={`font-mono font-medium ${winrateColor(m.winrate)}`}
                    >
                      {m.winrate.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {poolNoData.map((c) => (
                  <div key={c} className="flex items-center gap-3 opacity-40">
                    <span className="text-muted text-sm w-5">—</span>
                    <ChampionIcon championId={c} version={version} size={24} />
                    <span className="flex-1">{c}</span>
                    <span className="text-muted text-xs">geen data</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Geen data beschikbaar</p>
            )}
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted mb-3">
              Top counters buiten pool
            </h3>
            {topCounters.length > 0 ? (
              <div className="space-y-2">
                {topCounters.map((m) => (
                  <div key={m.champion} className="flex items-center gap-3">
                    <ChampionIcon
                      championId={m.champion}
                      version={version}
                      size={24}
                    />
                    <span className="flex-1">{m.champion}</span>
                    <span
                      className={`font-mono font-medium ${winrateColor(m.winrate)}`}
                    >
                      {m.winrate.toFixed(1)}%
                    </span>
                    {m.winrate > bestPoolWr && (
                      <span className="text-xs text-win">beter</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Geen data beschikbaar</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
