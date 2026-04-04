"use client";

import { useState, useRef, useEffect } from "react";
import type { Role } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";
import { RoleSelector, ROLES } from "@/components/role-selector";
import { formatChampionName } from "@/lib/ui-utils";

interface PoolInputProps {
  role: Role | null;
  champions: string[];
  allChampions: string[];
  version: string;
  onRoleChange: (role: Role) => void;
  onAddChampion: (id: string) => void;
  onRemoveChampion: (id: string) => void;
  compact?: boolean;
  hideRoleSelector?: boolean;
}

export function PoolInput({
  role,
  champions,
  allChampions,
  version,
  onRoleChange,
  onAddChampion,
  onRemoveChampion,
  compact = false,
  hideRoleSelector = false,
}: PoolInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = allChampions.filter(
    (c) =>
      (c.toLowerCase().includes(query.toLowerCase()) ||
        formatChampionName(c).toLowerCase().includes(query.toLowerCase())) &&
      !champions.includes(c),
  );
  // No auto-focus — champion picker handles initial selection

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
    onAddChampion(championId);
    setQuery("");
    inputRef.current?.focus();
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {!hideRoleSelector && (
          <div className="flex justify-center">
            <RoleSelector role={role} onRoleChange={onRoleChange} />
          </div>
        )}

        {role && (
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
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
                placeholder="Expand your pool..."
                className="w-full bg-input border border-input-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
              {isOpen && filtered.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-input border border-input-border rounded-lg z-50 max-h-96 overflow-y-auto p-3"
                >
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
                    {filtered.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleSelect(c)}
                        className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-card-border transition-colors"
                      >
                        <ChampionIcon
                          championId={c}
                          version={version}
                          size={48}
                        />
                        <span className="text-xs text-muted truncate w-full text-center leading-tight">
                          {formatChampionName(c)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {champions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {champions.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2 bg-background border border-card-border rounded-lg px-2.5 py-1"
                  >
                    <ChampionIcon championId={c} version={version} size={24} />
                    <span className="text-sm">{formatChampionName(c)}</span>
                    <button
                      onClick={() => onRemoveChampion(c)}
                      className="text-muted hover:text-loss text-sm leading-none -mr-1 p-1.5 -my-1"
                      aria-label={`Remove ${c}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
            Champions ({champions.length})
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {champions.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 bg-input border border-input-border rounded-lg px-3 py-1.5"
              >
                <ChampionIcon championId={c} version={version} size={24} />
                <span className="text-sm">{formatChampionName(c)}</span>
                <button
                  onClick={() => onRemoveChampion(c)}
                  className="text-muted hover:text-loss ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {
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
                placeholder="Search champion..."
                className="w-full bg-input border border-input-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
              {isOpen && filtered.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 mt-1 bg-input border border-input-border rounded-lg z-10 max-h-80 overflow-y-auto p-2"
                >
                  <div className="grid grid-cols-4 gap-1">
                    {filtered.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleSelect(c)}
                        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-card-border transition-colors w-20"
                      >
                        <ChampionIcon
                          championId={c}
                          version={version}
                          size={48}
                        />
                        <span className="text-xs text-muted truncate w-full text-center leading-tight">
                          {formatChampionName(c)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
        </div>
      )}
    </div>
  );
}
