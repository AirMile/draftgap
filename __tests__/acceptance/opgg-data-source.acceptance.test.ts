/**
 * Acceptance tests for opgg-data-source feature.
 * Tests contract-level behavior: HTTP status, response shape, data constraints.
 */
import * as fs from "fs";
import * as path from "path";

// Mock next/server (no Web APIs in Jest Node env)
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    }),
  },
}));

// --- Item 1 & 3: Mock fetchMatchups to return realistic data per role ---

const MOCK_DATASETS: Record<string, unknown> = {
  top: {
    patch: "current",
    role: "top",
    champions: ["Garen", "Darius", "Jax"],
    matchups: [
      { champion: "Garen", opponent: "Jax", winrate: 42, games: 663 },
      { champion: "Garen", opponent: "Kayle", winrate: 54.2, games: 521 },
      { champion: "Darius", opponent: "Garen", winrate: 51, games: 845 },
    ],
  },
  jungle: {
    patch: "current",
    role: "jungle",
    champions: ["LeeSin", "Elise"],
    matchups: [
      { champion: "LeeSin", opponent: "Elise", winrate: 48.5, games: 312 },
    ],
  },
  mid: {
    patch: "current",
    role: "mid",
    champions: ["Ahri", "Syndra"],
    matchups: [
      { champion: "Ahri", opponent: "Syndra", winrate: 50.1, games: 700 },
    ],
  },
  bot: {
    patch: "current",
    role: "bot",
    champions: ["Jinx", "KaiSa"],
    matchups: [
      { champion: "Jinx", opponent: "KaiSa", winrate: 47.3, games: 980 },
    ],
  },
  support: {
    patch: "current",
    role: "support",
    champions: ["Thresh", "Lulu"],
    matchups: [
      { champion: "Thresh", opponent: "Lulu", winrate: 52.8, games: 450 },
    ],
  },
};

jest.mock("@/lib/opgg", () => ({
  fetchMatchups: jest.fn().mockImplementation((role: string) => {
    const dataset = MOCK_DATASETS[role];
    if (!dataset) return Promise.reject(new Error(`No data for role: ${role}`));
    return Promise.resolve(dataset);
  }),
}));

import { GET } from "@/app/api/matchups/[role]/route";
import type { MatchupDataset, MatchupData } from "@/lib/types";

type MockResponse = { data: MatchupDataset; status: number };
type MockErrorResponse = { data: { error: string }; status: number };

// ============================================================
// Item 1: Live API contract verification (REQ-001)
// ============================================================

describe("REQ-001: API contract — GET /api/matchups/[role]", () => {
  const ROLES = ["top", "jungle", "mid", "bot", "support"] as const;

  it.each(ROLES)(
    "returns 200 with MatchupDataset shape for role=%s",
    async (role) => {
      const response = (await GET({} as Request, {
        params: Promise.resolve({ role }),
      })) as unknown as MockResponse;

      expect(response.status).toBe(200);

      const data = response.data;
      // MatchupDataset shape
      expect(data).toHaveProperty("patch");
      expect(data).toHaveProperty("role", role);
      expect(data).toHaveProperty("champions");
      expect(data).toHaveProperty("matchups");

      // Type checks
      expect(typeof data.patch).toBe("string");
      expect(Array.isArray(data.champions)).toBe(true);
      expect(Array.isArray(data.matchups)).toBe(true);

      // Champions are strings
      for (const c of data.champions) {
        expect(typeof c).toBe("string");
      }

      // Matchup entries conform to MatchupData shape
      for (const m of data.matchups) {
        expect(m).toHaveProperty("champion");
        expect(m).toHaveProperty("opponent");
        expect(m).toHaveProperty("winrate");
        expect(m).toHaveProperty("games");
      }
    },
  );

  it("returns 400 for invalid role", async () => {
    const response = (await GET({} as Request, {
      params: Promise.resolve({ role: "assassin" }),
    })) as unknown as MockErrorResponse;

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Invalid role");
  });
});

// ============================================================
// Item 3: Data shape validation (REQ-002)
// ============================================================

describe("REQ-002: Data shape validation", () => {
  // DDragon ID pattern: PascalCase, no spaces, no dots, no apostrophes
  const DDRAGON_ID_PATTERN = /^[A-Za-z0-9]+$/;

  it.each(["top", "jungle", "mid", "bot", "support"] as const)(
    "matchup entries for role=%s have valid winrate, games, and DDragon IDs",
    async (role) => {
      const response = (await GET({} as Request, {
        params: Promise.resolve({ role }),
      })) as unknown as MockResponse;

      expect(response.status).toBe(200);
      const { matchups } = response.data;

      expect(matchups.length).toBeGreaterThan(0);

      for (const m of matchups) {
        // Winrate between 0 and 100
        expect(m.winrate).toBeGreaterThanOrEqual(0);
        expect(m.winrate).toBeLessThanOrEqual(100);

        // Games > 0
        expect(m.games).toBeGreaterThan(0);

        // Champion and opponent are DDragon IDs (no spaces, dots, apostrophes)
        expect(m.champion).toMatch(DDRAGON_ID_PATTERN);
        expect(m.opponent).toMatch(DDRAGON_ID_PATTERN);
      }
    },
  );
});

// ============================================================
// REQ-004: Mock import removal check
// ============================================================

describe("REQ-004: pool/page.tsx uses API, not mock import", () => {
  const poolPagePath = path.resolve(__dirname, "../../app/pool/page.tsx");

  let poolPageSource: string;

  beforeAll(() => {
    poolPageSource = fs.readFileSync(poolPagePath, "utf-8");
  });

  it("does NOT import from mock-matchups.json", () => {
    expect(poolPageSource).not.toContain("mock-matchups");
  });

  it("fetches from /api/matchups/ endpoint", () => {
    expect(poolPageSource).toContain("/api/matchups/");
  });
});
