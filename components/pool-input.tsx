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
  gradeSlot?: React.ReactNode;
  dropdownBordered?: boolean;
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
  gradeSlot,
  dropdownBordered = false,
}: PoolInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const queryLower = query.toLowerCase();
  const filtered = allChampions
    .filter(
      (c) =>
        (c.toLowerCase().includes(queryLower) ||
          formatChampionName(c).toLowerCase().includes(queryLower)) &&
        !champions.includes(c),
    )
    .sort((a, b) => formatChampionName(a).localeCompare(formatChampionName(b)));
  // Pool champions matching query (for dropdown pool section)
  const poolFiltered = query
    ? champions.filter(
        (c) =>
          c.toLowerCase().includes(queryLower) ||
          formatChampionName(c).toLowerCase().includes(queryLower),
      )
    : champions;
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
        setPending([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePending = (championId: string) => {
    setPending((prev) =>
      prev.includes(championId)
        ? prev.filter((c) => c !== championId)
        : [...prev, championId],
    );
  };

  const handleSelect = (championId: string) => {
    onAddChampion(championId);
    setQuery("");
    inputRef.current?.focus();
  };

  const confirmPending = () => {
    for (const c of pending) {
      onAddChampion(c);
    }
    setPending([]);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
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
          <div
            className={`relative bg-card border border-card-border rounded-xl p-4 min-h-[70px] flex flex-col justify-center cursor-text ${isOpen && (filtered.length > 0 || poolFiltered.length > 0) ? "rounded-b-none border-b-transparent" : ""}`}
            onClick={() => inputRef.current?.focus()}
          >
            {gradeSlot && (
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {gradeSlot}
              </div>
            )}
            <div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={(e) => {
                  setIsOpen(true);
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
                placeholder="Expand your pool..."
                aria-label="Expand your pool"
                className="w-full bg-transparent px-0 py-0 text-foreground placeholder:text-muted focus:outline-none"
              />
              {isOpen && (filtered.length > 0 || poolFiltered.length > 0) && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full -left-px -right-px -mt-px bg-card border-x border-b border-card-border z-50 h-96 flex flex-col"
                >
                  <div className="overflow-y-auto p-3 flex-1">
                    {/* Pool champions section */}
                    {poolFiltered.length > 0 && (
                      <>
                        <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5 px-1">
                          Your pool
                        </p>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1 mb-3">
                          {poolFiltered.map((c) => (
                            <button
                              key={c}
                              onClick={() => onRemoveChampion(c)}
                              className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors border bg-accent/8 border-accent/30 hover:border-red-500/50 hover:bg-red-500/10 relative"
                            >
                              <div className="rounded-lg overflow-hidden relative">
                                <div className="transition-transform duration-150 group-hover:scale-90">
                                  <ChampionIcon
                                    championId={c}
                                    version={version}
                                    size={48}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-red-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-red-300"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  >
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                </div>
                              </div>
                              <span className="text-xs truncate w-full text-center leading-tight text-foreground">
                                {formatChampionName(c)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {/* Available champions */}
                    {filtered.length > 0 && (
                      <>
                        {poolFiltered.length > 0 && (
                          <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5 px-1">
                            Add to pool
                          </p>
                        )}
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
                          {filtered.map((c) => {
                            const selected = pending.includes(c);
                            return (
                              <button
                                key={c}
                                onClick={() => togglePending(c)}
                                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors border ${
                                  selected
                                    ? "bg-accent/8 border-accent/30"
                                    : "border-transparent hover:bg-card-border"
                                }`}
                              >
                                <div
                                  className={`rounded-lg overflow-hidden transition-opacity ${selected ? "" : "opacity-70 hover:opacity-100"}`}
                                >
                                  <ChampionIcon
                                    championId={c}
                                    version={version}
                                    size={48}
                                  />
                                </div>
                                <span
                                  className={`text-xs truncate w-full text-center leading-tight ${selected ? "text-foreground" : "text-muted"}`}
                                >
                                  {formatChampionName(c)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  {pending.length > 0 && (
                    <div className="px-3 pb-3 pt-3 border-t border-card-border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmPending();
                        }}
                        className="w-full py-3 rounded-lg font-medium text-sm bg-accent/15 border border-accent/25 text-accent hover:bg-accent/30 hover:border-accent/50 transition-colors"
                      >
                        Add {pending.length} champion
                        {pending.length > 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  aria-label={`Remove ${formatChampionName(c)}`}
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
                aria-label="Search champion"
                className="w-full bg-input border border-input-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
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
