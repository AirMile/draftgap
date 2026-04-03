/**
 * Acceptance tests for opgg-data-source feature.
 * Tests contract-level behavior: HTTP status, response shape, data constraints.
 * Routes now read static JSON files instead of calling OP.GG MCP.
 */

// Mock next/server (no Web APIs in Jest Node env)
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    }),
  },
}));

// --- Mock datasets per role ---

const MOCK_DATASETS: Record<string, unknown> = {
  top: {
    patch: "16.7",
    role: "top",
    champions: ["Garen", "Darius", "Jax"],
    matchups: [
      { champion: "Garen", opponent: "Jax", winrate: 42, games: 663 },
      { champion: "Garen", opponent: "Kayle", winrate: 54.2, games: 521 },
      { champion: "Darius", opponent: "Garen", winrate: 51, games: 845 },
    ],
  },
  jungle: {
    patch: "16.7",
    role: "jungle",
    champions: ["LeeSin", "Elise"],
    matchups: [
      { champion: "LeeSin", opponent: "Elise", winrate: 48.5, games: 312 },
    ],
  },
  mid: {
    patch: "16.7",
    role: "mid",
    champions: ["Ahri", "Syndra"],
    matchups: [
      { champion: "Ahri", opponent: "Syndra", winrate: 50.1, games: 700 },
    ],
  },
  bot: {
    patch: "16.7",
    role: "bot",
    champions: ["Jinx", "KaiSa"],
    matchups: [
      { champion: "Jinx", opponent: "KaiSa", winrate: 47.3, games: 980 },
    ],
  },
  support: {
    patch: "16.7",
    role: "support",
    champions: ["Thresh", "Lulu"],
    matchups: [
      { champion: "Thresh", opponent: "Lulu", winrate: 52.8, games: 450 },
    ],
  },
};

jest.mock("fs", () => {
  const realFs = jest.requireActual<typeof import("fs")>("fs");
  return {
    ...realFs,
    readFileSync: jest
      .fn()
      .mockImplementation((_path: string, _encoding?: string) => {
        // For acceptance tests that read real source files, pass through
        if (
          typeof _path === "string" &&
          (_path.includes("app/") || _path.includes("components/"))
        ) {
          return realFs.readFileSync(_path, _encoding as BufferEncoding);
        }
        // For route handler JSON reads, return mock data
        const match =
          typeof _path === "string"
            ? _path.match(/matchups\/(\w+)\.json/)
            : null;
        const role = match ? match[1] : "";
        const dataset = MOCK_DATASETS[role];
        if (!dataset) throw new Error(`File not found: ${_path}`);
        return JSON.stringify(dataset);
      }),
  };
});

jest.mock("path", () => {
  const realPath = jest.requireActual<typeof import("path")>("path");
  return {
    ...realPath,
    join: (...args: string[]) => args.join("/"),
  };
});

import * as fs from "fs";
import * as path from "path";
import { GET } from "@/app/api/matchups/[role]/route";
import type { MatchupDataset } from "@/lib/types";

type MockResponse = { data: MatchupDataset; status: number };
type MockErrorResponse = { data: { error: string }; status: number };

// ============================================================
// Item 1: API contract verification (REQ-001)
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
      expect(data).toHaveProperty("patch");
      expect(data).toHaveProperty("role", role);
      expect(data).toHaveProperty("champions");
      expect(data).toHaveProperty("matchups");

      expect(typeof data.patch).toBe("string");
      expect(Array.isArray(data.champions)).toBe(true);
      expect(Array.isArray(data.matchups)).toBe(true);

      for (const c of data.champions) {
        expect(typeof c).toBe("string");
      }

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
        expect(m.winrate).toBeGreaterThanOrEqual(0);
        expect(m.winrate).toBeLessThanOrEqual(100);
        expect(m.games).toBeGreaterThan(0);
        expect(m.champion).toMatch(DDRAGON_ID_PATTERN);
        expect(m.opponent).toMatch(DDRAGON_ID_PATTERN);
      }
    },
  );
});

// ============================================================
// REQ-004: pool/page.tsx uses API, not mock import
// ============================================================

describe("REQ-004: page.tsx uses API, not mock import", () => {
  const realFs = jest.requireActual<typeof import("fs")>("fs");
  const realPath = jest.requireActual<typeof import("path")>("path");
  const poolPagePath = realPath.resolve(__dirname, "../../app/page.tsx");

  let poolPageSource: string;

  beforeAll(() => {
    poolPageSource = realFs.readFileSync(poolPagePath, "utf-8");
  });

  it("does NOT import from mock-matchups.json", () => {
    expect(poolPageSource).not.toContain("mock-matchups");
  });

  it("fetches from /api/matchups/ endpoint", () => {
    expect(poolPageSource).toContain("/api/matchups/");
  });
});
