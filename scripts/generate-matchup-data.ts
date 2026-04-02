/**
 * One-time matchup data generator.
 * Fetches matchup data from U.GG for all champions per role.
 * U.GG embeds structured JSON in their matchups pages — no scraping needed.
 *
 * Usage: npm run generate-data
 */

import * as fs from "fs";
import * as path from "path";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
const UGG_BASE = "https://u.gg/lol/champions";
const OUTPUT_DIR = path.join(__dirname, "../data/matchups");

// U.GG role names in URL
const ROLE_NAMES: Record<string, string> = {
  top: "top",
  jungle: "jungle",
  mid: "mid",
  bot: "adc",
  support: "support",
};

// Minimum games for a matchup to be included
const MIN_GAMES = 10;

// Delay between requests (ms)
const REQUEST_DELAY = 1500;

// --- DDragon ---

async function getLatestVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);
  const versions: string[] = await res.json();
  return versions[0];
}

interface DDChampion {
  id: string;
  name: string;
  key: number;
}

async function getDDragonChampions(): Promise<DDChampion[]> {
  const version = await getLatestVersion();
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/champion.json`,
  );
  const json = await res.json();
  return Object.values(
    json.data as Record<string, { id: string; name: string; key: string }>,
  ).map((e) => ({
    id: e.id === "MonkeyKing" ? "Wukong" : e.id,
    name: e.id === "MonkeyKing" ? "Wukong" : e.name,
    key: parseInt(e.key, 10),
  }));
}

// --- U.GG data extraction ---

interface UGGMatchupEntry {
  champion_id: number;
  win_rate: number;
  wins?: number;
  matches: number;
}

/**
 * Fetch matchup data for a champion from U.GG.
 * U.GG embeds a JSON array with matchup stats in the page HTML.
 */
async function fetchUGGMatchups(
  championSlug: string,
  role: string,
): Promise<UGGMatchupEntry[]> {
  const url = `${UGG_BASE}/${championSlug}/matchups?role=${role}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    console.warn(`  ⚠ ${championSlug}: HTTP ${res.status}`);
    return [];
  }

  const html = await res.text();

  // U.GG embeds JSON data twice per tier: once for /counter page (small),
  // once for /matchups page (full). We need the LAST occurrence which has
  // the complete matchup data.
  const uggRoleKey =
    role === "adc" ? "adc" : role === "support" ? "support" : role;
  const dataKey = `"world_emerald_plus_${uggRoleKey}":{`;

  // Find the LAST occurrence (matchups page data, not counter page data)
  let keyIdx = -1;
  let searchFrom = 0;
  while (true) {
    const nextIdx = html.indexOf(dataKey, searchFrom);
    if (nextIdx === -1) break;
    keyIdx = nextIdx;
    searchFrom = nextIdx + 1;
  }

  if (keyIdx === -1) {
    console.warn(`  ⚠ ${championSlug}: key ${dataKey} not found`);
    return [];
  }

  // Find the counters array within this tier's data
  const countersIdx = html.indexOf('"counters":[', keyIdx);
  if (countersIdx === -1 || countersIdx > keyIdx + 5000) {
    console.warn(`  ⚠ ${championSlug}: no counters array`);
    return [];
  }

  const arrayStart = html.indexOf("[", countersIdx);
  if (arrayStart === -1) return [];

  let depth = 0;
  let arrayEnd = arrayStart;
  for (let i = arrayStart; i < arrayStart + 100000; i++) {
    if (html[i] === "[") depth++;
    if (html[i] === "]") depth--;
    if (depth === 0) {
      arrayEnd = i + 1;
      break;
    }
  }

  try {
    return JSON.parse(html.substring(arrayStart, arrayEnd));
  } catch {
    console.warn(`  ⚠ ${championSlug}: JSON parse error`);
    return [];
  }
}

// --- OP.GG MCP for champion lists per role ---

async function fetchRoleChampions(role: string): Promise<string[]> {
  const OPGG_MCP_URL = "https://mcp-api.op.gg/mcp";
  const ROLE_TO_OPGG: Record<string, string> = {
    top: "top",
    jungle: "jungle",
    mid: "mid",
    bot: "adc",
    support: "support",
  };

  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } =
    await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  const ddChampions = await getDDragonChampions();
  const nameToId = new Map(ddChampions.map((c) => [c.name, c.id]));

  const client = new Client({
    name: "lol-pool-optimizer-generate",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(OPGG_MCP_URL));
  await client.connect(transport);

  try {
    const position = ROLE_TO_OPGG[role] ?? role;
    const result = await client.callTool({
      name: "lol_list_lane_meta_champions",
      arguments: {
        position,
        desired_output_fields: [
          `data.positions.${position}[].{champion,play,win_rate,tier}`,
        ],
      },
    });

    const contentArr = result.content as
      | { type: string; text?: string }[]
      | undefined;
    const text =
      contentArr?.[0]?.type === "text" ? (contentArr[0].text ?? "") : "";

    const champions: string[] = [];
    const entryRegex = /\w+\("([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(text)) !== null) {
      const id = nameToId.get(match[1]) ?? match[1];
      champions.push(id);
    }
    return champions;
  } finally {
    await client.close();
  }
}

// --- Main ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== LoL Matchup Data Generator (U.GG) ===\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const ddChampions = await getDDragonChampions();
  const keyToId = new Map(ddChampions.map((c) => [c.key, c.id]));
  const idToSlug = new Map(
    ddChampions.map((c) => [c.id, c.name.toLowerCase().replace(/[^a-z]/g, "")]),
  );
  const patch = await getLatestVersion();
  const patchShort = patch.split(".").slice(0, 2).join(".");

  console.log(`DDragon: ${ddChampions.length} champions, patch ${patchShort}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const roles = ["top", "jungle", "mid", "bot", "support"];

  for (const role of roles) {
    console.log(`\n--- ${role.toUpperCase()} ---`);

    // Get champion list for this role
    let champions: string[];
    try {
      champions = await fetchRoleChampions(role);
      console.log(`Champions from OP.GG: ${champions.length}`);
    } catch (err) {
      console.error(`Failed to get champions for ${role}:`, err);
      continue;
    }

    const uggRole = ROLE_NAMES[role] ?? role;
    const allMatchups: Array<{
      champion: string;
      opponent: string;
      winrate: number;
      games: number;
    }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < champions.length; i++) {
      const champId = champions[i];
      // U.GG uses lowercase display names in URLs (e.g. "dr. mundo" → not good)
      // Actually U.GG uses slug format: drmundo, tahmkench, aurelionsol
      const slug = champId.toLowerCase();
      process.stdout.write(`  [${i + 1}/${champions.length}] ${champId}...`);

      try {
        const entries = await fetchUGGMatchups(slug, uggRole);
        const valid = entries.filter(
          (e) => e.matches >= MIN_GAMES && e.win_rate > 0,
        );

        let added = 0;
        for (const entry of valid) {
          const oppId = keyToId.get(entry.champion_id);
          if (!oppId) continue;

          const key = `${champId}:${oppId}`;
          if (!seen.has(key)) {
            seen.add(key);
            allMatchups.push({
              champion: champId,
              opponent: oppId,
              winrate: Math.round(entry.win_rate * 100) / 100,
              games: entry.matches,
            });
            added++;
          }
        }

        console.log(` ${valid.length} matchups (${added} new)`);
      } catch (err) {
        console.log(` ERROR: ${err}`);
      }

      if (i < champions.length - 1) {
        await sleep(REQUEST_DELAY);
      }
    }

    const dataset = {
      patch: patchShort,
      role,
      champions,
      matchups: allMatchups,
    };

    const outPath = path.join(OUTPUT_DIR, `${role}.json`);
    fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));

    console.log(
      `\n  ✓ ${role}: ${champions.length} champions, ${allMatchups.length} matchups → ${outPath}`,
    );
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
