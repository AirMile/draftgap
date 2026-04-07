"use client";

import { useState, useRef, useEffect } from "react";
import { ChampionIcon } from "@/components/champion-icon";
import { formatChampionName } from "@/lib/ui-utils";

interface EnemySearchProps {
  opponents: string[];
  version: string;
  selectedEnemy: string | null;
  onSelectEnemy: (enemy: string | null) => void;
  connected?: boolean;
}

export function EnemySearch({
  opponents,
  version,
  selectedEnemy,
  onSelectEnemy,
  connected,
}: EnemySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = opponents.filter(
    (c) =>
      c.toLowerCase().includes(query.toLowerCase()) ||
      formatChampionName(c).toLowerCase().includes(query.toLowerCase()),
  );
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

  return (
    <div
      className={`bg-card border border-card-border p-4 min-h-[70px] flex flex-col justify-center cursor-text ${connected ? "rounded-t-xl" : isOpen && filtered.length > 0 ? "rounded-t-xl rounded-b-none border-b-transparent" : "rounded-xl"}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="relative -mx-4 px-4">
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
              setTimeout(
                () =>
                  e.target.scrollIntoView({
                    block: "start",
                    behavior: "smooth",
                  }),
                300,
              );
            }
          }}
          placeholder="Who are you playing against?"
          aria-label="Search enemy champion"
          className="w-full bg-transparent px-0 py-0 text-foreground placeholder:text-muted focus:outline-none"
        />
        {isOpen && filtered.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full -left-px -right-px -mt-px bg-card border border-card-border border-t-0 rounded-b-xl z-20 h-96 overflow-y-auto p-3"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
              {filtered.map((c) => (
                <button
                  key={c}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEnemy(c);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-transparent hover:bg-card-border/20 transition-colors"
                >
                  <div className="rounded-lg overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                    <ChampionIcon championId={c} version={version} size={48} />
                  </div>
                  <span className="text-xs text-muted truncate w-full text-center leading-tight">
                    {formatChampionName(c)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
