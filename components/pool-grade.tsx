"use client";

import { useState, useRef, useEffect } from "react";
import type { PoolScoreResult } from "@/lib/pool-score";

function gradeColor(grade: string): string {
  if (grade === "S" || grade === "A") return "text-accent";
  if (grade === "B") return "text-win";
  if (grade === "C") return "text-neutral";
  return "text-loss";
}

function gradeBorderColor(grade: string): string {
  if (grade === "S" || grade === "A") return "border-accent/30";
  if (grade === "B") return "border-win/30";
  if (grade === "C") return "border-neutral/30";
  return "border-loss/30";
}

function barColor(grade: string): string {
  if (grade === "S" || grade === "A") return "bg-accent/60";
  if (grade === "B") return "bg-win/60";
  if (grade === "C") return "bg-neutral/60";
  return "bg-loss/60";
}

const LABELS: Record<string, string> = {
  coverage: "Coverage",
  winrate: "Winrate",
  consistency: "Consistency",
  metaGaps: "Meta",
};

const MAX_SCORES: Record<string, number> = {
  coverage: 40,
  winrate: 30,
  consistency: 20,
  metaGaps: 10,
};

export function PoolGrade({ result }: { result: PoolScoreResult }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 border ${gradeBorderColor(result.grade)} rounded-lg px-2.5 py-1 hover:opacity-80 transition-opacity`}
        aria-label={`Pool grade: ${result.grade} (${result.score}/100)`}
        aria-expanded={open}
      >
        <span className={`text-sm font-bold ${gradeColor(result.grade)}`}>
          {result.grade}
        </span>
        <span className="text-xs text-muted tabular-nums">{result.score}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-card border border-card-border rounded-lg p-3 z-30 w-52 shadow-lg">
          <div className="space-y-2">
            {(Object.entries(result.breakdown) as [string, number][]).map(
              ([key, value]) => {
                const pct = (value / MAX_SCORES[key]) * 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-muted">{LABELS[key]}</span>
                      <span className="text-foreground tabular-nums">
                        {Math.round(value)}/{MAX_SCORES[key]}
                      </span>
                    </div>
                    <div className="h-1 bg-card-border/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(result.grade)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
