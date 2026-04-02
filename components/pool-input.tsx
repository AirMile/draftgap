"use client";

import { useState, useRef, useEffect } from "react";
import type { Role } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";

const ROLES: { value: Role; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "jungle", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "bot", label: "Bot" },
  { value: "support", label: "Support" },
];

interface PoolInputProps {
  role: Role | null;
  champions: string[];
  allChampions: string[];
  version: string;
  maxChampions: number;
  onRoleChange: (role: Role) => void;
  onAddChampion: (id: string) => void;
  onRemoveChampion: (id: string) => void;
}

export function PoolInput({
  role,
  champions,
  allChampions,
  version,
  maxChampions,
  onRoleChange,
  onAddChampion,
  onRemoveChampion,
}: PoolInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = allChampions
    .filter(
      (c) =>
        c.toLowerCase().includes(query.toLowerCase()) && !champions.includes(c),
    )
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

  const handleSelect = (championId: string) => {
    if (champions.length < maxChampions) {
      onAddChampion(championId);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Role
        </label>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === r.value
                  ? "bg-accent text-background"
                  : "bg-card border border-card-border text-foreground hover:border-accent-dim"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {role && (
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Champions ({champions.length}/{maxChampions})
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {champions.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-1.5"
              >
                <ChampionIcon championId={c} version={version} size={24} />
                <span className="text-sm">{c}</span>
                <button
                  onClick={() => onRemoveChampion(c)}
                  className="text-muted hover:text-loss ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {champions.length < maxChampions && (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Zoek champion..."
                className="w-full bg-card border border-card-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
              {isOpen && filtered.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-card-border rounded-lg overflow-hidden z-10 max-h-64 overflow-y-auto"
                >
                  {filtered.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelect(c)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-card-border text-left transition-colors"
                    >
                      <ChampionIcon
                        championId={c}
                        version={version}
                        size={24}
                      />
                      <span className="text-sm">{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
