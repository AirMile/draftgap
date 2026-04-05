"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Role } from "@/lib/types";
import { ChampionIcon } from "@/components/champion-icon";
import { RoleSelector, ROLES } from "@/components/role-selector";
import { formatChampionName } from "@/lib/ui-utils";
import { getChampionIconUrl } from "@/lib/ddragon";

// Track loaded image URLs across renders — survives memory cache eviction
const loadedImageUrls = new Set<string>();

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
}: PoolInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loadedChampionsKey, setLoadedChampionsKey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preload champion icons — show skeleton tags until all images are loaded
  const championsKey = champions.join(",");

  // Sync check: if all images have been loaded before, skip skeleton entirely
  const allImagesCached =
    champions.length === 0 ||
    champions.every((c) => loadedImageUrls.has(getChampionIconUrl(c, version)));

  const tagImagesReady = championsKey === loadedChampionsKey || allImagesCached;

  useEffect(() => {
    if (allImagesCached) {
      setLoadedChampionsKey(championsKey);
      return;
    }
    let cancelled = false;
    const promises = champions.map(
      (c) =>
        new Promise<void>((resolve) => {
          const url = getChampionIconUrl(c, version);
          if (loadedImageUrls.has(url)) {
            resolve();
            return;
          }
          const img = new window.Image();
          img.onload = () => {
            loadedImageUrls.add(url);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        }),
    );
    Promise.all(promises).then(() => {
      if (!cancelled) setLoadedChampionsKey(championsKey);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- championsKey is a stable serialization of champions
  }, [championsKey, version, allImagesCached]);

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
                onFocus={(e) => {
                  setIsOpen(true);
                  const el = e.target;
                  setTimeout(() => {
                    const parent = el.closest(".bg-card");
                    (parent ?? el).scrollIntoView({
                      block: "start",
                      behavior: "smooth",
                    });
                  }, 300);
                }}
                placeholder="Expand your pool..."
                aria-label="Expand your pool"
                className="w-full bg-input border border-input-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
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
              <div className="space-y-2">
                {tagImagesReady ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {champions.map((c) => (
                      <div
                        key={c}
                        className="flex items-center gap-1.5 sm:gap-2 bg-background border border-card-border rounded-lg px-2 sm:px-2.5 py-1 sm:py-1"
                      >
                        <ChampionIcon
                          championId={c}
                          version={version}
                          size={20}
                        />
                        <span className="text-sm">{formatChampionName(c)}</span>
                        <button
                          onClick={() => onRemoveChampion(c)}
                          className="text-muted hover:text-loss text-xs sm:text-sm leading-none -mr-0.5 sm:-mr-1 p-1 sm:p-1.5 -my-1"
                          aria-label={`Remove ${c}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {champions.map((c) => (
                      <div
                        key={c}
                        className="flex items-center gap-1 sm:gap-2 border border-card-border rounded-lg px-1.5 sm:px-2.5 py-0.5 sm:py-1"
                      >
                        <div className="skeleton !rounded-full w-5 h-5 shrink-0" />
                        <div className="skeleton h-3 sm:h-3.5 w-12 sm:w-16" />
                        <div className="w-4 sm:w-5" />
                      </div>
                    ))}
                  </div>
                )}
                {gradeSlot && (
                  <div className="flex justify-end">{gradeSlot}</div>
                )}
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
