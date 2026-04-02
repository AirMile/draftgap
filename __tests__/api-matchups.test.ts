/**
 * Tests for /api/matchups/[role] route.
 * Mocks next/server since Web APIs aren't available in Jest's Node env.
 */
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    }),
  },
}));

jest.mock("@/lib/opgg", () => ({
  fetchMatchups: jest.fn().mockResolvedValue({
    patch: "current",
    role: "top",
    champions: ["Garen", "Darius"],
    matchups: [{ champion: "Garen", opponent: "Jax", winrate: 42, games: 663 }],
  }),
}));

import { GET, revalidate } from "@/app/api/matchups/[role]/route";

describe("/api/matchups/[role]", () => {
  it("exports revalidate = 86400 (24h ISR cache)", () => {
    expect(revalidate).toBe(86400);
  });

  it("returns matchup data for valid role", async () => {
    const response = (await GET({} as Request, {
      params: Promise.resolve({ role: "top" }),
    })) as unknown as { data: { role: string }; status: number };

    expect(response.status).toBe(200);
    expect(response.data.role).toBe("top");
  });

  it("returns 400 for invalid role", async () => {
    const response = (await GET({} as Request, {
      params: Promise.resolve({ role: "invalid" }),
    })) as unknown as { data: { error: string }; status: number };

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Invalid role");
  });
});
