import type { Role, MatchupData, MatchupDataset } from "./types";
import { getChampions } from "./ddragon";

const OPGG_MCP_URL = "https://mcp-api.op.gg/mcp";
const MAX_CHAMPIONS = 30;
const CONCURRENCY = 5;

const ROLE_TO_OPGG: Record<Role, string> = {
  top: "top",
  jungle: "jungle",
  mid: "mid",
  bot: "adc",
  support: "support",
};

export interface CounterEntry {
  champion_name: string;
  play: number;
  win_rate: number;
}

export interface CounterResult {
  strong: CounterEntry[];
  weak: CounterEntry[];
  position: CounterEntry[];
}

/**
 * Convert a display name (e.g. "Dr. Mundo") to UPPER_SNAKE_CASE for OP.GG MCP tool calls.
 */
export function toUpperSnake(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

/**
 * Parse OP.GG's custom text response format for counter data.
 * Extracts strong_counters and weak_counters from the class-based format.
 */
export function parseCounterResponse(text: string): CounterResult {
  if (!text || text === "[]" || !text.includes("Data(")) {
    return { strong: [], weak: [], position: [] };
  }

  // Determine which fields Data has
  const dataClassMatch = text.match(/class Data: (.+)/);
  if (!dataClassMatch) return { strong: [], weak: [], position: [] };
  const dataFields = dataClassMatch[1].split(",");

  const hasStrong = dataFields.includes("strong_counters");
  const hasWeak = dataFields.includes("weak_counters");

  // Find the counter class fields to know which positional arg is win_rate
  // e.g. "class StrongCounter: champion_name,play,win_rate" or "champion_name,play,win,win_rate"
  const counterClassMatch = text.match(/class \w+Counter: ([^\n]+)/);
  const counterFields = counterClassMatch
    ? counterClassMatch[1].split(",")
    : [];
  const winRateIndex = counterFields.indexOf("win_rate");
  const playIndex = counterFields.indexOf("play");
  const nameIndex = counterFields.indexOf("champion_name");

  // Extract top-level arrays from Data(...)
  const arrays = extractDataArrays(text);

  const strong: CounterEntry[] = [];
  const weak: CounterEntry[] = [];

  if (hasStrong && hasWeak) {
    if (arrays.length >= 2) {
      strong.push(
        ...parseCounterEntries(arrays[0], nameIndex, playIndex, winRateIndex),
      );
      weak.push(
        ...parseCounterEntries(arrays[1], nameIndex, playIndex, winRateIndex),
      );
    }
  } else if (hasStrong) {
    if (arrays.length >= 1) {
      strong.push(
        ...parseCounterEntries(arrays[0], nameIndex, playIndex, winRateIndex),
      );
    }
  } else if (hasWeak) {
    if (arrays.length >= 1) {
      weak.push(
        ...parseCounterEntries(arrays[0], nameIndex, playIndex, winRateIndex),
      );
    }
  }

  // Parse position-level counters (Counter(id,name,play,win) inside Position)
  const position: CounterEntry[] = [];
  const hasSummary = dataFields.includes("summary");
  if (hasSummary) {
    // Find Counter class fields: class Counter: champion_id,champion_name,play,win
    const posCounterClassMatch = text.match(/class Counter: ([^\n]+)/);
    if (posCounterClassMatch) {
      const posFields = posCounterClassMatch[1].split(",");
      const posNameIdx = posFields.indexOf("champion_name");
      const posPlayIdx = posFields.indexOf("play");
      const posWinIdx = posFields.indexOf("win");

      // Position counters are in the last array(s) — look for Counter() entries
      // They represent the champion's win rate against these opponents
      const counterRegex = /Counter\(([^)]+)\)/g;
      let cm;
      while ((cm = counterRegex.exec(text)) !== null) {
        const args = parseArgs(cm[1]);
        if (args.length > Math.max(posNameIdx, posPlayIdx, posWinIdx)) {
          const play = args[posPlayIdx] as number;
          const win = args[posWinIdx] as number;
          if (play > 0) {
            position.push({
              champion_name: args[posNameIdx] as string,
              play,
              win_rate: win / play,
            });
          }
        }
      }
    }
  }

  return { strong, weak, position };
}

/**
 * Extract top-level array contents from the Data(...) constructor call.
 */
function extractDataArrays(text: string): string[] {
  const dataStart = text.indexOf("Data(");
  if (dataStart === -1) return [];

  const content = text.substring(dataStart + 5);
  const arrays: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < content.length; i++) {
    if (content[i] === "[") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (content[i] === "]") {
      depth--;
      if (depth === 0 && start >= 0) {
        arrays.push(content.substring(start, i));
        start = -1;
      }
    }
  }

  return arrays;
}

/**
 * Parse individual counter entries from an array string.
 * Handles both 3-arg (name,play,win_rate) and 4-arg (name,play,win,win_rate) formats.
 */
function parseCounterEntries(
  arrayContent: string,
  nameIndex: number,
  playIndex: number,
  winRateIndex: number,
): CounterEntry[] {
  const entries: CounterEntry[] = [];
  // Match: ClassName("name",num,...,num)
  const entryRegex = /\w+\(([^)]+)\)/g;
  let match;

  while ((match = entryRegex.exec(arrayContent)) !== null) {
    const args = parseArgs(match[1]);
    if (args.length > winRateIndex) {
      entries.push({
        champion_name: args[nameIndex] as string,
        play: args[playIndex] as number,
        win_rate: args[winRateIndex] as number,
      });
    }
  }

  return entries;
}

/**
 * Parse comma-separated arguments, handling quoted strings and numbers.
 */
function parseArgs(argsStr: string): (string | number)[] {
  const args: (string | number)[] = [];
  const regex = /"([^"]*)"|([\d.]+)/g;
  let m;
  while ((m = regex.exec(argsStr)) !== null) {
    if (m[1] !== undefined) {
      args.push(m[1]);
    } else {
      args.push(Number(m[2]));
    }
  }
  return args;
}

/**
 * Convert parsed counter data to MatchupData[].
 * Strong counters: win_rate = opponent's WR → flip for champion's perspective.
 * Weak counters: win_rate = champion's WR → use directly.
 */
export function countersToMatchupData(
  championId: string,
  counters: CounterResult,
  nameToId: Map<string, string>,
): MatchupData[] {
  const matchups: MatchupData[] = [];

  for (const entry of counters.strong) {
    const opponentId = nameToId.get(entry.champion_name) ?? entry.champion_name;
    matchups.push({
      champion: championId,
      opponent: opponentId,
      winrate: round1((1 - entry.win_rate) * 100),
      games: entry.play,
    });
  }

  for (const entry of counters.weak) {
    const opponentId = nameToId.get(entry.champion_name) ?? entry.champion_name;
    matchups.push({
      champion: championId,
      opponent: opponentId,
      winrate: round1(entry.win_rate * 100),
      games: entry.play,
    });
  }

  // Position counters: win_rate = champion's WR against the counter (bad matchups)
  // Skip duplicates already covered by strong/weak counters
  const existingOpponents = new Set(matchups.map((m) => m.opponent));
  for (const entry of counters.position ?? []) {
    const opponentId = nameToId.get(entry.champion_name) ?? entry.champion_name;
    if (!existingOpponents.has(opponentId)) {
      matchups.push({
        champion: championId,
        opponent: opponentId,
        winrate: round1(entry.win_rate * 100),
        games: entry.play,
      });
    }
  }

  return matchups;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Parse the meta tier list response to get champion names for a role.
 */
function parseMetaChampions(text: string): string[] {
  const champions: string[] = [];
  // Match: Top("ChampName",...) or similar position entries
  const entryRegex = /\w+\("([^"]+)"/g;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    champions.push(match[1]);
  }
  return champions;
}

/**
 * Fetch the champion list for a role from OP.GG's meta tier list.
 * Returns DDragon IDs sorted by tier/playrate.
 */
export async function fetchRoleChampions(role: Role): Promise<string[]> {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } =
    await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  const ddChampions = await getChampions();
  const nameToId = new Map<string, string>();
  for (const c of ddChampions) {
    nameToId.set(c.name, c.id);
  }

  const client = new Client({ name: "lol-pool-optimizer", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(OPGG_MCP_URL));
  await client.connect(transport);

  try {
    const position = ROLE_TO_OPGG[role];
    const metaResult = await client.callTool({
      name: "lol_list_lane_meta_champions",
      arguments: {
        position,
        desired_output_fields: [
          `data.positions.${position}[].{champion,play,win_rate,tier}`,
        ],
      },
    });

    const contentArr = metaResult.content as
      | { type: string; text?: string }[]
      | undefined;
    const metaText =
      contentArr?.[0]?.type === "text" ? (contentArr[0].text ?? "") : "";
    const champNames = parseMetaChampions(metaText);
    return champNames.map((n) => nameToId.get(n) ?? n);
  } finally {
    await client.close();
  }
}

/**
 * Fetch matchup data from OP.GG MCP for a given role.
 * Gets the top N champions from the meta tier list, then fetches counter data for each.
 */
export async function fetchMatchups(role: Role): Promise<MatchupDataset> {
  // Dynamic import to keep MCP SDK as a server-only dependency
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } =
    await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  // Build DDragon name → ID map
  const ddChampions = await getChampions();
  const nameToId = new Map<string, string>();
  for (const c of ddChampions) {
    nameToId.set(c.name, c.id);
  }

  const client = new Client({ name: "lol-pool-optimizer", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(OPGG_MCP_URL));
  await client.connect(transport);

  try {
    const position = ROLE_TO_OPGG[role];

    // Step 1: Get meta tier list for the role
    const metaResult = await client.callTool({
      name: "lol_list_lane_meta_champions",
      arguments: {
        position,
        desired_output_fields: [
          `data.positions.${position}[].{champion,play,win_rate,tier}`,
        ],
      },
    });

    const metaContentArr = metaResult.content as
      | { type: string; text?: string }[]
      | undefined;
    const metaText =
      metaContentArr?.[0]?.type === "text"
        ? (metaContentArr[0].text ?? "")
        : "";
    const champNames = parseMetaChampions(metaText).slice(0, MAX_CHAMPIONS);

    // Step 2: Fetch counter data for each champion in batches
    const allMatchups: MatchupData[] = [];

    for (let i = 0; i < champNames.length; i += CONCURRENCY) {
      const batch = champNames.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (name) => {
          const result = await client.callTool({
            name: "lol_get_champion_analysis",
            arguments: {
              game_mode: "ranked",
              champion: toUpperSnake(name),
              position,
              desired_output_fields: [
                "data.strong_counters[].{champion_name,play,win_rate}",
                "data.weak_counters[].{champion_name,play,win_rate}",
                "data.summary.positions[].{name,counters}",
              ],
            },
          });
          const resultContent = result.content as
            | { type: string; text?: string }[]
            | undefined;
          const text =
            resultContent?.[0]?.type === "text"
              ? (resultContent[0].text ?? "")
              : "";
          return { name, text };
        }),
      );

      for (const { name, text } of results) {
        const ddId = nameToId.get(name) ?? name;
        const counters = parseCounterResponse(text);
        allMatchups.push(...countersToMatchupData(ddId, counters, nameToId));
      }
    }

    const champions = champNames.map((n) => nameToId.get(n) ?? n);

    return {
      patch: "current",
      role,
      champions,
      matchups: allMatchups,
    };
  } finally {
    await client.close();
  }
}
