import {
  getLatestVersion,
  getChampions,
  getChampionIconUrl,
} from "@/lib/ddragon";

const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getLatestVersion", () => {
  it("returns the first version from the versions array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ["14.10.1", "14.9.1", "14.8.1"],
    } as Response);

    const version = await getLatestVersion();
    expect(version).toBe("14.10.1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(getLatestVersion()).rejects.toThrow(
      "Failed to fetch DDragon versions: 500",
    );
  });
});

describe("getChampions", () => {
  const mockChampionResponse = {
    data: {
      Aatrox: { id: "Aatrox", name: "Aatrox", key: "266" },
      Ahri: { id: "Ahri", name: "Ahri", key: "103" },
      MonkeyKing: { id: "MonkeyKing", name: "Wukong", key: "62" },
    },
  };

  it("maps DDragon format to Champion interface", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChampionResponse,
    } as Response);

    const champions = await getChampions("14.10.1");
    expect(champions).toHaveLength(3);
    expect(champions[0]).toEqual({
      id: "Aatrox",
      name: "Aatrox",
      key: "266",
      roles: [],
    });
  });

  it("maps MonkeyKing to Wukong", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChampionResponse,
    } as Response);

    const champions = await getChampions("14.10.1");
    const wukong = champions.find((c) => c.key === "62");
    expect(wukong).toEqual({
      id: "Wukong",
      name: "Wukong",
      key: "62",
      roles: [],
    });
  });

  it("resolves latest version when none provided", async () => {
    // First call: versions endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ["14.10.1"],
    } as Response);
    // Second call: champions endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await getChampions();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://ddragon.leagueoflegends.com/cdn/14.10.1/data/en_US/champion.json",
    );
  });
});

describe("getChampionIconUrl", () => {
  it("returns correct URL format", () => {
    const url = getChampionIconUrl("Aatrox", "14.10.1");
    expect(url).toBe(
      "https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Aatrox.png",
    );
  });

  it("works with Wukong champion ID", () => {
    const url = getChampionIconUrl("Wukong", "14.10.1");
    expect(url).toBe(
      "https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Wukong.png",
    );
  });
});
