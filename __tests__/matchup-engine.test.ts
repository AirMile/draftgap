import type { MatchupData, GapResult, Suggestion } from "@/lib/types";
import {
  bestPick,
  findGaps,
  suggestChampions,
  rankPoolVsEnemy,
} from "@/lib/matchup-engine";

const matchups: MatchupData[] = [
  { champion: "Darius", opponent: "Irelia", winrate: 54.2, games: 2500 },
  { champion: "Garen", opponent: "Irelia", winrate: 51.8, games: 2000 },
  { champion: "Darius", opponent: "Camille", winrate: 46.5, games: 1800 },
  { champion: "Garen", opponent: "Camille", winrate: 47.2, games: 1500 },
  { champion: "Darius", opponent: "Fiora", winrate: 44.1, games: 2200 },
  { champion: "Garen", opponent: "Fiora", winrate: 45.3, games: 1900 },
  { champion: "Darius", opponent: "Sett", winrate: 52.0, games: 3000 },
  { champion: "Garen", opponent: "Sett", winrate: 52.0, games: 2800 },
];

describe("bestPick", () => {
  it("returns champion with highest winrate vs opponent", () => {
    const pool = ["Darius", "Garen"];
    const result = bestPick(pool, "Irelia", matchups);
    expect(result).toBe("Darius");
  });

  it("breaks ties by higher game count", () => {
    const pool = ["Darius", "Garen"];
    // Both have 52.0% vs Sett, Darius has more games
    const result = bestPick(pool, "Sett", matchups);
    expect(result).toBe("Darius");
  });

  it("returns null when no matchup data exists", () => {
    const pool = ["Darius"];
    const result = bestPick(pool, "UnknownChamp", matchups);
    expect(result).toBeNull();
  });
});

describe("findGaps", () => {
  it("detects opponents where no pool champion has >48% WR", () => {
    const pool = ["Darius", "Garen"];
    const opponents = ["Irelia", "Camille", "Fiora"];
    const gaps = findGaps(pool, opponents, matchups);

    const fiora = gaps.find((g) => g.opponent === "Fiora");
    expect(fiora?.isGap).toBe(true);

    const irelia = gaps.find((g) => g.opponent === "Irelia");
    expect(irelia?.isGap).toBe(false);
  });

  it("returns best winrate and champion for each opponent", () => {
    const pool = ["Darius", "Garen"];
    const gaps = findGaps(pool, ["Irelia"], matchups);
    expect(gaps[0].bestWinrate).toBe(54.2);
    expect(gaps[0].bestChampion).toBe("Darius");
  });

  it("marks opponent as gap when best WR is exactly 48%", () => {
    const edgeMatchups: MatchupData[] = [
      { champion: "Darius", opponent: "TestChamp", winrate: 48.0, games: 1000 },
    ];
    const gaps = findGaps(["Darius"], ["TestChamp"], edgeMatchups);
    expect(gaps[0].isGap).toBe(true);
  });
});

describe("suggestChampions", () => {
  it("returns champions sorted by gaps fixed descending", () => {
    const pool = ["Darius", "Garen"];
    const gapOpponents = ["Camille", "Fiora"];
    const allMatchups: MatchupData[] = [
      ...matchups,
      { champion: "Yorick", opponent: "Camille", winrate: 55.0, games: 1200 },
      { champion: "Yorick", opponent: "Fiora", winrate: 51.0, games: 1100 },
      { champion: "Sett", opponent: "Camille", winrate: 49.5, games: 1300 },
      { champion: "Sett", opponent: "Fiora", winrate: 47.0, games: 1000 },
    ];

    const suggestions = suggestChampions(pool, gapOpponents, allMatchups, [
      "Yorick",
      "Sett",
    ]);

    expect(suggestions[0].champion).toBe("Yorick");
    expect(suggestions[0].gapsFixed).toBe(2);
    expect(suggestions[1].champion).toBe("Sett");
    expect(suggestions[1].gapsFixed).toBe(1);
  });

  it("excludes pool champions from suggestions", () => {
    const pool = ["Darius"];
    const allMatchups: MatchupData[] = [
      { champion: "Darius", opponent: "Fiora", winrate: 51.0, games: 1000 },
    ];
    const suggestions = suggestChampions(pool, ["Fiora"], allMatchups, [
      "Darius",
    ]);
    expect(suggestions).toHaveLength(0);
  });

  it("returns max 5 suggestions", () => {
    const pool = ["Darius"];
    const gapOpponents = ["Fiora"];
    const candidates = ["A", "B", "C", "D", "E", "F"];
    const allMatchups: MatchupData[] = candidates.map((c) => ({
      champion: c,
      opponent: "Fiora",
      winrate: 50.0,
      games: 1000,
    }));
    const suggestions = suggestChampions(
      pool,
      gapOpponents,
      allMatchups,
      candidates,
    );
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});

describe("rankPoolVsEnemy", () => {
  it("ranks pool champions by winrate vs enemy (high to low)", () => {
    const pool = ["Darius", "Garen"];
    const result = rankPoolVsEnemy(pool, "Irelia", matchups);
    expect(result[0].champion).toBe("Darius");
    expect(result[0].winrate).toBe(54.2);
    expect(result[1].champion).toBe("Garen");
    expect(result[1].winrate).toBe(51.8);
  });

  it("returns empty array when no matchup data for enemy", () => {
    const result = rankPoolVsEnemy(["Darius"], "Unknown", matchups);
    expect(result).toEqual([]);
  });
});
