/**
 * Tests for /api/champions/[role] route.
 * Mocks next/server and fs since the route reads static JSON files.
 */
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    }),
  },
}));

const MOCK_DATASET = JSON.stringify({
  patch: "16.7",
  role: "top",
  champions: ["Garen", "Darius", "Camille", "Jax"],
  matchups: [{ champion: "Garen", opponent: "Jax", winrate: 42, games: 663 }],
});

jest.mock("fs", () => ({
  readFileSync: jest.fn().mockReturnValue(MOCK_DATASET),
}));

jest.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

import { GET, revalidate } from "@/app/api/champions/[role]/route";

describe("/api/champions/[role]", () => {
  it("exports revalidate = 86400 (24h ISR cache)", () => {
    expect(revalidate).toBe(86400);
  });

  it("returns champion list for valid role", async () => {
    const response = (await GET({} as Request, {
      params: Promise.resolve({ role: "top" }),
    })) as unknown as { data: string[]; status: number };

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data).toContain("Garen");
  });

  it("returns 400 for invalid role", async () => {
    const response = (await GET({} as Request, {
      params: Promise.resolve({ role: "invalid" }),
    })) as unknown as { data: { error: string }; status: number };

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Invalid role");
  });

  it("accepts all 5 valid roles", async () => {
    for (const role of ["top", "jungle", "mid", "bot", "support"]) {
      const response = (await GET({} as Request, {
        params: Promise.resolve({ role }),
      })) as unknown as { data: string[]; status: number };

      expect(response.status).toBe(200);
    }
  });
});
