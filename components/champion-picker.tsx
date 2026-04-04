"use client";

import { useState, useEffect, useRef } from "react";
import type { Role } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";

interface ChampionPickerProps {
  role: Role;
  champions: string[];
  championsLoading: boolean;
  version: string;
  onConfirm: (selected: string[]) => void;
}

export function ChampionPicker({
  role,
  champions,
  championsLoading,
  version,
  onConfirm,
}: ChampionPickerProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const prevRole = useRef(role);

  useEffect(() => {
    if (role !== prevRole.current) {
      prevRole.current = role;
      setSelection([]);
    }
  }, [role]);

  const togglePick = (id: string) => {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(selection);
  };

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="max-w-5xl w-full flex flex-col">
        <div
          className={`bg-card border border-card-border rounded-xl p-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3 h-[28rem] overflow-y-auto content-start ${championsLoading && champions.length > 0 ? "opacity-40 pointer-events-none transition-opacity duration-200" : ""}`}
        >
          {champions.length === 0 && championsLoading
            ? Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-2">
                  <div className="w-12 h-12 rounded-lg bg-card-border/40 animate-pulse" />
                  <div className="w-10 h-3 rounded bg-card-border/30 animate-pulse" />
                </div>
              ))
            : champions.map((c) => {
                const selected = selection.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => togglePick(c)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
                      selected
                        ? "bg-accent/20 ring-2 ring-accent"
                        : "hover:bg-card"
                    }`}
                  >
                    <ChampionIcon championId={c} version={version} size={48} />
                    <span
                      className={`text-[11px] leading-tight truncate w-full text-center ${
                        selected ? "text-accent font-medium" : "text-muted"
                      }`}
                    >
                      {c}
                    </span>
                  </button>
                );
              })}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-2 flex-wrap min-h-[34px]">
            {selection.map((c) => (
              <div
                key={c}
                className="flex items-center gap-1.5 bg-card border border-card-border rounded-lg px-2 py-1"
              >
                <ChampionIcon championId={c} version={version} size={24} />
                <span className="text-sm">{c}</span>
                <button
                  onClick={() => togglePick(c)}
                  className="text-muted hover:text-loss text-sm leading-none -mr-1 p-1.5 -my-1"
                >
                  ×
                </button>
              </div>
            ))}
            {selection.length === 0 && (
              <span className="text-muted text-sm">No champions selected</span>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={selection.length === 0}
            className="w-full py-2.5 rounded-lg font-medium transition-colors bg-accent text-background hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm ({selection.length})
          </button>
        </div>
      </div>
    </div>
  );
}
