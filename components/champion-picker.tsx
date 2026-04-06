"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { Role } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

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
  const [search, setSearch] = useState("");
  const prevRole = useRef(role);

  useEffect(() => {
    if (role !== prevRole.current) {
      prevRole.current = role;
      setSelection([]);
      setSearch("");
    }
  }, [role]);

  const filteredChampions = useMemo(() => {
    if (!search) return champions;
    const q = search.toLowerCase();
    return champions.filter(
      (c) =>
        c.toLowerCase().includes(q) ||
        formatChampionName(c).toLowerCase().includes(q),
    );
  }, [champions, search]);

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
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => {
              if (window.innerWidth < 640) {
                const el = e.target;
                setTimeout(() => {
                  const parent = el.closest(".bg-card");
                  (parent ?? el).scrollIntoView({
                    block: "start",
                    behavior: "smooth",
                  });
                }, 300);
              }
            }}
            placeholder="Search champions..."
            aria-label="Search champions"
            className="w-full bg-input border border-input-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          <div
            className={`grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3 h-[28rem] overflow-y-auto content-start ${championsLoading && champions.length > 0 ? "opacity-40 pointer-events-none transition-opacity duration-200" : ""}`}
          >
            {champions.length === 0 && championsLoading
              ? Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-2"
                  >
                    <div className="skeleton w-12 h-12 !rounded-lg" />
                    <div className="skeleton w-10 h-3" />
                  </div>
                ))
              : filteredChampions.map((c) => {
                  const selected = selection.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => togglePick(c)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200 border ${
                        selected
                          ? "bg-accent/8 border-accent/30 shadow-[0_0_8px_rgba(200,155,60,0.12)]"
                          : "border-transparent hover:bg-card-border/20"
                      }`}
                    >
                      <div
                        className={`rounded-lg overflow-hidden transition-opacity duration-200 ${selected ? "" : "opacity-70 hover:opacity-100"}`}
                      >
                        <ChampionIcon
                          championId={c}
                          version={version}
                          size={48}
                        />
                      </div>
                      <span
                        className={`text-xs leading-tight truncate w-full text-center ${
                          selected ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {formatChampionName(c)}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <div className="hidden sm:flex items-center gap-2 flex-wrap min-h-[34px]">
            {selection.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 bg-background border border-card-border rounded-lg px-2.5 py-1"
              >
                <ChampionIcon championId={c} version={version} size={24} />
                <span className="text-sm">{formatChampionName(c)}</span>
                <button
                  onClick={() => togglePick(c)}
                  className="text-muted hover:text-loss text-sm leading-none -mr-1 p-1.5 -my-1"
                  aria-label={`Remove ${formatChampionName(c)}`}
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
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 bg-accent/15 border border-accent/25 text-accent hover:bg-accent/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Confirm ({selection.length})
          </button>
        </div>
      </div>
    </div>
  );
}
