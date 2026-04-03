"use client";

import { useState, useRef, useEffect } from "react";
import { ChampionIcon } from "@/components/champion-icon";

interface EnemySearchProps {
  opponents: string[];
  version: string;
  selectedEnemy: string | null;
  onSelectEnemy: (enemy: string | null) => void;
}

export function EnemySearch({
  opponents,
  version,
  selectedEnemy,
  onSelectEnemy,
}: EnemySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = opponents.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
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
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedEnemy ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelectEnemy(null);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!selectedEnemy) setIsOpen(true);
          }}
          placeholder="Tegen wie speel je?"
          className="w-full bg-card-border/30 border border-card-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
        />
        {selectedEnemy && (
          <button
            onClick={() => {
              onSelectEnemy(null);
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
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-card-border rounded-lg z-20 max-h-96 overflow-y-auto p-3"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1">
              {filtered.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onSelectEnemy(c);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-card-border transition-colors"
                >
                  <ChampionIcon championId={c} version={version} size={48} />
                  <span className="text-xs text-muted truncate w-full text-center leading-tight">
                    {c}
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
