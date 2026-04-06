import { computePoolScore } from "@/lib/pool-score";
import type { GapResult } from "@/lib/types";

function makeGaps(
  entries: { opponent: string; bestWinrate: number; pickRate?: number }[],
): { gaps: GapResult[]; pickRateMap: Map<string, number> } {
  const gaps: GapResult[] = entries.map((e) => ({
    opponent: e.opponent,
    bestWinrate: e.bestWinrate,
    bestChampion: "TestChamp",
    isGap: e.bestWinrate <= 48,
    pickRate: e.pickRate ?? 0.05,
  }));
  const pickRateMap = new Map(
    entries.map((e) => [e.opponent, e.pickRate ?? 0.05]),
  );
  return { gaps, pickRateMap };
}

describe("computePoolScore", () => {
  it("returns F for empty gaps", () => {
    const result = computePoolScore([], new Map());
    expect(result.grade).toBe("F");
    expect(result.score).toBe(0);
  });

  it("returns S/A for perfect coverage with high winrates", () => {
    const { gaps, pickRateMap } = makeGaps(
      Array.from({ length: 20 }, (_, i) => ({
        opponent: `Champ${i}`,
        bestWinrate: 55,
      })),
    );
    const result = computePoolScore(gaps, pickRateMap);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(["S", "A"]).toContain(result.grade);
  });

  it("returns D/F for many gaps with low winrates", () => {
    const { gaps, pickRateMap } = makeGaps(
      Array.from({ length: 20 }, (_, i) => ({
        opponent: `Champ${i}`,
        bestWinrate: 40,
        pickRate: 0.08,
      })),
    );
    const result = computePoolScore(gaps, pickRateMap);
    expect(result.score).toBeLessThan(40);
    expect(["D", "F"]).toContain(result.grade);
  });

  it("penalizes gaps against high pick rate opponents more", () => {
    const base = Array.from({ length: 15 }, (_, i) => ({
      opponent: `Good${i}`,
      bestWinrate: 52,
    }));

    const { gaps: gapsLowPR, pickRateMap: mapLow } = makeGaps([
      ...base,
      { opponent: "GapChamp", bestWinrate: 42, pickRate: 0.01 },
    ]);
    const { gaps: gapsHighPR, pickRateMap: mapHigh } = makeGaps([
      ...base,
      { opponent: "GapChamp", bestWinrate: 42, pickRate: 0.15 },
    ]);

    const scoreLow = computePoolScore(gapsLowPR, mapLow);
    const scoreHigh = computePoolScore(gapsHighPR, mapHigh);
    expect(scoreLow.score).toBeGreaterThan(scoreHigh.score);
  });

  it("rewards consistency (low variance)", () => {
    // Consistent pool: all at 52%
    const { gaps: consistent, pickRateMap: map1 } = makeGaps(
      Array.from({ length: 10 }, (_, i) => ({
        opponent: `C${i}`,
        bestWinrate: 52,
      })),
    );
    // Volatile pool: same average but wild swings
    const volatile = Array.from({ length: 10 }, (_, i) => ({
      opponent: `V${i}`,
      bestWinrate: i < 5 ? 62 : 42,
    }));
    const { gaps: volatileGaps, pickRateMap: map2 } = makeGaps(volatile);

    const consistentScore = computePoolScore(consistent, map1);
    const volatileScore = computePoolScore(volatileGaps, map2);
    expect(consistentScore.breakdown.consistency).toBeGreaterThan(
      volatileScore.breakdown.consistency,
    );
  });

  it("breakdown values sum to approximately the total score", () => {
    const { gaps, pickRateMap } = makeGaps(
      Array.from({ length: 10 }, (_, i) => ({
        opponent: `Champ${i}`,
        bestWinrate: 49 + i,
      })),
    );
    const result = computePoolScore(gaps, pickRateMap);
    const sum =
      result.breakdown.coverage +
      result.breakdown.winrate +
      result.breakdown.consistency +
      result.breakdown.metaGaps;
    // Allow rounding difference of 1
    expect(Math.abs(result.score - Math.round(sum))).toBeLessThanOrEqual(1);
  });

  it("grade thresholds are correct", () => {
    // Test boundary: 95+ = S, 85-94 = A, 70-84 = B, 55-69 = C, 40-54 = D, <40 = F
    const { gaps: sGaps, pickRateMap: sMap } = makeGaps(
      Array.from({ length: 20 }, (_, i) => ({
        opponent: `C${i}`,
        bestWinrate: 56,
      })),
    );
    const sResult = computePoolScore(sGaps, sMap);
    expect(sResult.grade).toBe("S");
  });
});
