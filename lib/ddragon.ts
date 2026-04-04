import type { Champion } from "@/lib/types";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

/**
 * Fetch the latest DDragon version from the versions API.
 */
export async function getLatestVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch DDragon versions: ${res.status}`);
  }
  const versions: string[] = await res.json();
  return versions[0];
}

interface DDragonChampionEntry {
  id: string;
  name: string;
  key: string;
}

interface DDragonChampionResponse {
  data: Record<string, DDragonChampionEntry>;
}

/**
 * Fetch champion data from DDragon CDN.
 * If no version is provided, the latest version is resolved automatically.
 */
export async function getChampions(version?: string): Promise<Champion[]> {
  const v = version ?? (await getLatestVersion());
  const res = await fetch(`${DDRAGON_BASE}/cdn/${v}/data/en_US/champion.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch DDragon champions: ${res.status}`);
  }
  const json: DDragonChampionResponse = await res.json();

  return Object.values(json.data).map((entry) => ({
    id: entry.id === "MonkeyKing" ? "Wukong" : entry.id,
    name: entry.id === "MonkeyKing" ? "Wukong" : entry.name,
    key: entry.key,
    roles: [],
  }));
}

/**
 * Build the DDragon icon URL for a champion.
 */
export function getChampionIconUrl(
  championId: string,
  version: string,
): string {
  const ddId = championId === "Wukong" ? "MonkeyKing" : championId;
  return `${DDRAGON_BASE}/cdn/${version}/img/champion/${ddId}.png`;
}
