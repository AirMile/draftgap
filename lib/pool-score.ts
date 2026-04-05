import type { GapResult } from "@/lib/types";

const GAP_THRESHOLD = 48;

export interface PoolScoreBreakdown {
  coverage: number;
  winrate: number;
  consistency: number;
  metaGaps: number;
}

export interface PoolScoreResult {
  score: number;
  grade: string;
  breakdown: PoolScoreBreakdown;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function computePoolScore(
  gaps: GapResult[],
  pickRateMap: Map<string, number>,
): PoolScoreResult {
  if (gaps.length === 0) {
    return {
      score: 0,
      grade: "F",
      breakdown: { coverage: 0, winrate: 0, consistency: 0, metaGaps: 0 },
    };
  }

  // Coverage (0-40): % of opponents above gap threshold
  const nonGaps = gaps.filter((g) => g.bestWinrate > GAP_THRESHOLD).length;
  const coverage = (nonGaps / gaps.length) * 40;

  // Average winrate (0-30): how well you win across all matchups
  const avgWr = gaps.reduce((sum, g) => sum + g.bestWinrate, 0) / gaps.length;
  const winrate = clamp((avgWr - 45) / 10, 0, 1) * 30;

  // Consistency (0-20): low variance in best winrates
  const sd = stdDev(gaps.map((g) => g.bestWinrate));
  const consistency = clamp(1 - (sd - 2) / 8, 0, 1) * 20;

  // Meta gap penalty (0-10): gaps against popular champions hurt more
  const weightedGapCost = gaps
    .filter((g) => g.isGap)
    .reduce((sum, g) => {
      const pickRate = pickRateMap.get(g.opponent) ?? 0;
      return sum + (GAP_THRESHOLD - g.bestWinrate) * pickRate;
    }, 0);
  // Normalize: worst case is ~5 high-pickrate gaps at 30% WR
  const maxCost = 5 * 0.1 * (GAP_THRESHOLD - 30);
  const metaGaps = clamp(1 - weightedGapCost / maxCost, 0, 1) * 10;

  const score = Math.round(coverage + winrate + consistency + metaGaps);

  return {
    score,
    grade: scoreToGrade(score),
    breakdown: {
      coverage: Math.round(coverage * 10) / 10,
      winrate: Math.round(winrate * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      metaGaps: Math.round(metaGaps * 10) / 10,
    },
  };
}
