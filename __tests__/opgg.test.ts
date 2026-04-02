import type { MatchupData } from "@/lib/types";
import {
  parseCounterResponse,
  countersToMatchupData,
  toUpperSnake,
} from "@/lib/opgg";

describe("toUpperSnake", () => {
  it("converts simple names", () => {
    expect(toUpperSnake("Garen")).toBe("GAREN");
  });

  it("converts names with spaces", () => {
    expect(toUpperSnake("Lee Sin")).toBe("LEE_SIN");
  });

  it("converts names with apostrophes", () => {
    expect(toUpperSnake("Cho'Gath")).toBe("CHO_GATH");
  });

  it("converts names with dots and spaces", () => {
    expect(toUpperSnake("Dr. Mundo")).toBe("DR_MUNDO");
  });
});

describe("parseCounterResponse", () => {
  it("parses strong + weak counters", () => {
    const text = `class LolGetChampionAnalysis: data
class Data: strong_counters,weak_counters
class StrongCounter: champion_name,play,win_rate

LolGetChampionAnalysis(Data([StrongCounter("Jax",663,0.58),StrongCounter("Darius",845,0.51)],[StrongCounter("Kayle",521,0.54),StrongCounter("Camille",583,0.52)]))`;

    const result = parseCounterResponse(text);

    expect(result.strong).toEqual([
      { champion_name: "Jax", play: 663, win_rate: 0.58 },
      { champion_name: "Darius", play: 845, win_rate: 0.51 },
    ]);
    expect(result.weak).toEqual([
      { champion_name: "Kayle", play: 521, win_rate: 0.54 },
      { champion_name: "Camille", play: 583, win_rate: 0.52 },
    ]);
  });

  it("parses strong counters only", () => {
    const text = `class LolGetChampionAnalysis: data
class Data: strong_counters
class StrongCounter: champion_name,play,win_rate

LolGetChampionAnalysis(Data([StrongCounter("Garen",575,0.51)]))`;

    const result = parseCounterResponse(text);
    expect(result.strong).toEqual([
      { champion_name: "Garen", play: 575, win_rate: 0.51 },
    ]);
    expect(result.weak).toEqual([]);
  });

  it("parses weak counters only", () => {
    const text = `class LolGetChampionAnalysis: data
class Data: weak_counters
class WeakCounter: champion_name,play,win,win_rate

LolGetChampionAnalysis(Data([WeakCounter("Garen",864,423,0.51)]))`;

    const result = parseCounterResponse(text);
    expect(result.strong).toEqual([]);
    expect(result.weak).toEqual([
      { champion_name: "Garen", play: 864, win_rate: 0.51 },
    ]);
  });

  it("returns empty for empty response", () => {
    const result = parseCounterResponse("[]");
    expect(result.strong).toEqual([]);
    expect(result.weak).toEqual([]);
  });

  it("handles response with extra fields (win count)", () => {
    const text = `class LolGetChampionAnalysis: data
class Data: strong_counters,weak_counters
class StrongCounter: champion_name,play,win,win_rate

LolGetChampionAnalysis(Data([StrongCounter("Jax",663,384,0.58)],[StrongCounter("Kayle",521,281,0.54)]))`;

    const result = parseCounterResponse(text);
    expect(result.strong[0]).toEqual({
      champion_name: "Jax",
      play: 663,
      win_rate: 0.58,
    });
    expect(result.weak[0]).toEqual({
      champion_name: "Kayle",
      play: 521,
      win_rate: 0.54,
    });
  });
});

describe("countersToMatchupData", () => {
  const nameToId = new Map([
    ["Dr. Mundo", "DrMundo"],
    ["Cho'Gath", "Chogath"],
    ["Garen", "Garen"],
    ["Jax", "Jax"],
    ["Kayle", "Kayle"],
  ]);

  it("converts strong counters with flipped winrate", () => {
    const counters = {
      strong: [{ champion_name: "Jax", play: 663, win_rate: 0.58 }],
      weak: [],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result).toEqual([
      { champion: "Garen", opponent: "Jax", winrate: 42, games: 663 },
    ]);
  });

  it("converts weak counters with direct winrate", () => {
    const counters = {
      strong: [],
      weak: [{ champion_name: "Kayle", play: 521, win_rate: 0.54 }],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result).toEqual([
      { champion: "Garen", opponent: "Kayle", winrate: 54, games: 521 },
    ]);
  });

  it("maps OP.GG display names to DDragon IDs", () => {
    const counters = {
      strong: [{ champion_name: "Dr. Mundo", play: 400, win_rate: 0.55 }],
      weak: [],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result[0].opponent).toBe("DrMundo");
  });

  it("uses display name as fallback if no DDragon mapping", () => {
    const counters = {
      strong: [{ champion_name: "Zaahen", play: 300, win_rate: 0.52 }],
      weak: [],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result[0].opponent).toBe("Zaahen");
  });

  it("combines strong + weak counters", () => {
    const counters = {
      strong: [{ champion_name: "Jax", play: 663, win_rate: 0.58 }],
      weak: [{ champion_name: "Kayle", play: 521, win_rate: 0.54 }],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result).toHaveLength(2);
    expect(result[0].winrate).toBe(42); // strong: flipped
    expect(result[1].winrate).toBe(54); // weak: direct
  });

  it("rounds winrate to 1 decimal", () => {
    const counters = {
      strong: [{ champion_name: "Jax", play: 100, win_rate: 0.5237 }],
      weak: [],
    };

    const result = countersToMatchupData("Garen", counters, nameToId);

    expect(result[0].winrate).toBe(47.6); // (1 - 0.5237) * 100 = 47.63 → 47.6
  });
});
