/**
 * Matchup data generator.
 * Fetches matchup data from U.GG for all champions per role per tier.
 * Fetches champion info from Meraki Analytics.
 * U.GG embeds structured JSON in their matchups pages — all tiers in one fetch.
 *
 * Usage: npm run generate-data
 */

import * as fs from "fs";
import * as path from "path";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
const UGG_BASE = "https://u.gg/lol/champions";
const MERAKI_BASE =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions";
const OUTPUT_DIR = path.join(__dirname, "../data/matchups");
const CHAMPION_INFO_PATH = path.join(__dirname, "../data/champion-info.json");

// U.GG role names in URL
const ROLE_NAMES: Record<string, string> = {
  top: "top",
  jungle: "jungle",
  mid: "mid",
  bot: "adc",
  support: "support",
};

// Tiers to extract from U.GG HTML
const TIERS = [
  { key: "emerald_plus", dataKey: "emerald_plus" },
  { key: "platinum_plus", dataKey: "platinum_plus" },
  { key: "overall", dataKey: "overall" },
] as const;

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
 * Fetch matchup HTML for a champion from U.GG.
 * Returns the raw HTML to extract multiple tiers from.
 */
async function fetchUGGPage(
  championSlug: string,
  role: string,
): Promise<string | null> {
  const url = `${UGG_BASE}/${championSlug}/matchups?role=${role}&rank=platinum_plus`;
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });

    if (res.ok) return res.text();

    if (res.status === 403 && attempt < MAX_RETRIES) {
      const delay = REQUEST_DELAY * attempt * 2;
      console.warn(
        `  ⚠ ${championSlug}: HTTP 403, retry ${attempt}/${MAX_RETRIES - 1} in ${delay}ms`,
      );
      await sleep(delay);
      continue;
    }

    console.warn(`  ⚠ ${championSlug}: HTTP ${res.status}`);
    return null;
  }

  return null;
}

/**
 * Extract matchup entries for a specific tier from U.GG HTML.
 */
function extractTierMatchups(
  html: string,
  tierDataKey: string,
  uggRoleKey: string,
): UGGMatchupEntry[] {
  const dataKey = `"world_${tierDataKey}_${uggRoleKey}":{`;

  // Find the LAST occurrence (matchups page data, not counter page data)
  let keyIdx = -1;
  let searchFrom = 0;
  while (true) {
    const nextIdx = html.indexOf(dataKey, searchFrom);
    if (nextIdx === -1) break;
    keyIdx = nextIdx;
    searchFrom = nextIdx + 1;
  }

  if (keyIdx === -1) return [];

  // Find the counters array within this tier's data
  const countersIdx = html.indexOf('"counters":[', keyIdx);
  if (countersIdx === -1 || countersIdx > keyIdx + 5000) return [];

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
    return [];
  }
}

interface UGGOverview {
  winRate: number;
  pickRate: number;
  banRate: number;
}

/**
 * Extract overview stats (win_rate, pick_rate, ban_rate) for a specific tier.
 * Uses the FIRST occurrence of the tier block (overview data), unlike
 * extractTierMatchups which uses the LAST (counters data).
 */
function extractTierOverview(
  html: string,
  tierDataKey: string,
  uggRoleKey: string,
): UGGOverview | null {
  const dataKey = `"world_${tierDataKey}_${uggRoleKey}":{`;

  // Find the FIRST occurrence (overview data)
  const keyIdx = html.indexOf(dataKey);
  if (keyIdx === -1) return null;

  // Extract the text between the tier key and "counters" (or a reasonable limit)
  const snippet = html.substring(keyIdx, keyIdx + 500);

  const winMatch = snippet.match(/"win_rate":([\d.]+)/);
  const pickMatch = snippet.match(/"pick_rate":([\d.]+)/);
  const banMatch = snippet.match(/"ban_rate":([\d.]+)/);

  if (!winMatch || !pickMatch) return null;

  return {
    winRate: parseFloat(winMatch[1]),
    pickRate: parseFloat(pickMatch[1]),
    banRate: banMatch ? parseFloat(banMatch[1]) : 0,
  };
}

// --- OP.GG MCP for champion lists per role ---

interface RoleChampionResult {
  champions: string[];
  pickRates: Map<string, number>;
}

async function fetchRoleChampions(role: string): Promise<RoleChampionResult> {
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
    const pickRates = new Map<string, number>();

    // Parse entries: ClassName("ChampName",playCount,winRate)
    const entryRegex = /\w+\("([^"]+)",(\d+),/g;
    let match: RegExpExecArray | null;
    const playEntries: { id: string; play: number }[] = [];
    while ((match = entryRegex.exec(text)) !== null) {
      const id = nameToId.get(match[1]) ?? match[1];
      const play = parseInt(match[2], 10);
      champions.push(id);
      playEntries.push({ id, play });
    }

    // If regex didn't capture play counts, fallback to name-only
    if (playEntries.length === 0) {
      const nameOnly = /\w+\("([^"]+)"/g;
      while ((match = nameOnly.exec(text)) !== null) {
        const id = nameToId.get(match[1]) ?? match[1];
        champions.push(id);
      }
    }

    // Normalize play counts to pick rate percentages
    const totalPlay = playEntries.reduce((sum, e) => sum + e.play, 0);
    if (totalPlay > 0) {
      for (const entry of playEntries) {
        pickRates.set(
          entry.id,
          Math.round((entry.play / totalPlay) * 1000) / 10,
        );
      }
    }

    return { champions, pickRates };
  } finally {
    await client.close();
  }
}

// --- Meraki champion info ---

interface MerakiChampionInfo {
  id: string;
  attackType: string;
  roles: string[];
  damageTypes: string[];
  traits: string[];
  cc: string[];
}

const CC_PATTERNS: [RegExp, string][] = [
  [/\bstun\w*/i, "Stun"],
  [/\broot\w*/i, "Root"],
  [/\bsilenc\w*/i, "Silence"],
  [/\bslow(?:s|ed|ing)?\b/i, "Slow"],
  [/\bknock\w*\s?\w*back\b|\bknock\w*\s?\w*up\b|\bairborne\b/i, "Knockup"],
  [/\bcharm\w*/i, "Charm"],
  [/\bfear\w*\b|\bflee\w*/i, "Fear"],
  [/\btaunt\w*/i, "Taunt"],
  [/\bsuppress\w*/i, "Suppress"],
  [/\bground(?:s|ed|ing)?\b/i, "Ground"],
  [/\bpull(?:s|ed|ing)?\b/i, "Pull"],
  [/\bblind\w*/i, "Blind"],
  [/\bsleep\w*/i, "Sleep"],
  [/\bnearsight\w*/i, "Nearsight"],
];

function extractTraitsFromAbilities(abilities: Record<string, unknown[]>): {
  damageTypes: string[];
  traits: string[];
  cc: string[];
} {
  const damageTypes = new Set<string>();
  const traits = new Set<string>();
  const cc = new Set<string>();

  const allDescriptions: string[] = [];

  for (const [, spells] of Object.entries(abilities)) {
    if (!Array.isArray(spells)) continue;
    for (const spell of spells) {
      const s = spell as Record<string, unknown>;

      // Damage types from structured field
      if (s.damageType === "PHYSICAL_DAMAGE") damageTypes.add("AD");
      if (s.damageType === "MAGIC_DAMAGE") damageTypes.add("AP");
      if (s.damageType === "MIXED_DAMAGE") {
        // Check descriptions for actual damage types
        const descs =
          (s.effects as { description?: string }[] | undefined)
            ?.map((e) => e.description ?? "")
            .join(" ") ?? "";
        if (/physical damage/i.test(descs)) damageTypes.add("AD");
        if (/magic damage/i.test(descs)) damageTypes.add("AP");
        if (/true damage/i.test(descs)) {
          damageTypes.add("True");
          traits.add("True dmg");
        }
        // Fallback if nothing detected
        if (
          !damageTypes.has("AD") &&
          !damageTypes.has("AP") &&
          !damageTypes.has("True")
        ) {
          damageTypes.add("AD");
          damageTypes.add("AP");
        }
      }
      if (s.damageType === "TRUE_DAMAGE") {
        damageTypes.add("True");
        traits.add("True dmg");
      }

      // Heal from spellEffects
      if (s.spellEffects === "Heal") traits.add("Sustain");

      // Collect descriptions for keyword search
      const effects = s.effects as { description?: string }[] | undefined;
      if (Array.isArray(effects)) {
        for (const effect of effects) {
          if (effect.description) allDescriptions.push(effect.description);
        }
      }
    }
  }

  const fullText = allDescriptions.join(" ");

  // Traits from descriptions
  if (/\bheal|\blife\s?steal|\bomnivamp|\bregen/i.test(fullText))
    traits.add("Sustain");
  if (/\bshield\b/i.test(fullText)) traits.add("Shield");
  if (
    /target.s? (?:max(?:imum)?|total) health|% (?:of )?(?:max(?:imum)?|total) health.{0,30}damage/i.test(
      fullText,
    )
  )
    traits.add("%HP dmg");

  // CC from descriptions
  for (const [pattern, label] of CC_PATTERNS) {
    if (pattern.test(fullText)) cc.add(label);
  }

  return {
    damageTypes: [...damageTypes],
    traits: [...traits],
    cc: [...cc],
  };
}

async function fetchMerakiChampionInfo(
  champions: DDChampion[],
): Promise<MerakiChampionInfo[]> {
  console.log("\n--- CHAMPION INFO (Meraki) ---");
  const results: MerakiChampionInfo[] = [];

  for (const champ of champions) {
    const id = champ.id === "Wukong" ? "MonkeyKing" : champ.id;
    try {
      const res = await fetch(`${MERAKI_BASE}/${id}.json`);
      if (!res.ok) {
        console.warn(`  ⚠ ${champ.id}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const { damageTypes, traits, cc } = extractTraitsFromAbilities(
        data.abilities ?? {},
      );
      results.push({
        id: champ.id,
        attackType: data.attackType ?? "MELEE",
        roles: data.roles ?? [],
        damageTypes,
        traits,
        cc,
      });
    } catch (err) {
      console.warn(`  ⚠ ${champ.id}: ${err}`);
    }
  }

  console.log(`  ✓ ${results.length}/${champions.length} champions fetched`);
  return results;
}

// --- U.GG Duo Synergy ---

const UGG_VERSIONS_URL =
  "https://static.bigbrain.gg/assets/lol/riot_patch_update/prod/ugg/ugg-api-versions.json";
const UGG_DUOS_BASE = "https://stats2.u.gg/lol/1.5/champion_duos";

// U.GG rank IDs per tier
const TIER_RANK_IDS: Record<string, string> = {
  emerald_plus: "17",
  platinum_plus: "10",
  overall: "8",
};

// U.GG role IDs (champion's own role)
const DUO_ROLE_IDS: Record<string, string> = {
  bot: "3",
  support: "2",
};

const MAX_DUOS_PER_CHAMPION = 10;
// Higher tiers have less data, so scale the threshold
const MIN_DUO_GAMES_BY_TIER: Record<string, number> = {
  emerald_plus: 500,
  platinum_plus: 800,
  overall: 2000,
};

interface DuoEntry {
  champion: string;
  partner: string;
  winrate: number;
  games: number;
}

async function getDuoApiVersion(patchUnderscore: string): Promise<string> {
  const res = await fetch(UGG_VERSIONS_URL);
  const json = await res.json();
  return json[patchUnderscore]?.champion_duos ?? "1.5.0";
}

async function fetchDuoData(
  role: string,
  champions: string[],
  ddChampions: DDChampion[],
  patchShort: string,
  keyToId: Map<number, string>,
): Promise<Record<string, DuoEntry[]>> {
  const roleId = DUO_ROLE_IDS[role];
  if (!roleId) return {};

  const patchUnderscore = patchShort.replace(".", "_");
  const duoVersion = await getDuoApiVersion(patchUnderscore);
  const idToKey = new Map(ddChampions.map((c) => [c.id, c.key]));

  console.log(`\n  Fetching duo data (${duoVersion})...`);

  // Initialize per-tier accumulators
  const duosByTier: Record<string, DuoEntry[]> = {};
  for (const tier of TIERS) {
    duosByTier[tier.key] = [];
  }

  // Fetch once per champion, extract all tiers from single response
  for (let i = 0; i < champions.length; i++) {
    const champId = champions[i];
    const champKey = idToKey.get(champId);
    if (!champKey) continue;

    const url = `${UGG_DUOS_BASE}/${patchUnderscore}/ranked_solo_5x5/${champKey}/${duoVersion}.json`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!res.ok) {
        if (i < champions.length - 1) await sleep(REQUEST_DELAY);
        continue;
      }

      const json = await res.json();
      const regionData = json?.["12"];
      if (!regionData) {
        if (i < champions.length - 1) await sleep(REQUEST_DELAY);
        continue;
      }

      const counts: string[] = [];
      for (const tier of TIERS) {
        const rankId = TIER_RANK_IDS[tier.key];
        if (!rankId) continue;

        const roleData = regionData[rankId]?.[roleId];
        if (
          !roleData ||
          !Array.isArray(roleData) ||
          !Array.isArray(roleData[0])
        ) {
          counts.push(`${tier.key}:0`);
          continue;
        }

        const duoArray = roleData[0] as number[][];
        const champDuos: { partner: string; winrate: number; games: number }[] =
          [];

        for (const entry of duoArray) {
          const partnerId = keyToId.get(entry[0]);
          if (!partnerId) continue;
          const wins = entry[1];
          const matches = entry[2];
          const minGames = MIN_DUO_GAMES_BY_TIER[tier.key] ?? 500;
          if (matches < minGames) continue;

          const winrate = Math.round((wins / matches) * 10000) / 100;
          champDuos.push({ partner: partnerId, winrate, games: matches });
        }

        champDuos
          .sort((a, b) => b.winrate - a.winrate)
          .slice(0, MAX_DUOS_PER_CHAMPION)
          .forEach((d) => {
            duosByTier[tier.key].push({ champion: champId, ...d });
          });

        counts.push(
          `${tier.key}:${Math.min(champDuos.length, MAX_DUOS_PER_CHAMPION)}`,
        );
      }

      console.log(
        `  [${i + 1}/${champions.length}] ${champId}: ${counts.join(", ")}`,
      );
    } catch {
      // Skip on error
    }

    if (i < champions.length - 1) await sleep(REQUEST_DELAY);
  }

  return duosByTier;
}

// --- Main ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== LoL Matchup Data Generator (U.GG + Meraki) ===\n");

  const ddChampions = await getDDragonChampions();
  const keyToId = new Map(ddChampions.map((c) => [c.key, c.id]));
  const patch = await getLatestVersion();
  const patchShort = patch.split(".").slice(0, 2).join(".");

  console.log(`DDragon: ${ddChampions.length} champions, patch ${patchShort}`);

  // Create output dirs per tier
  for (const tier of TIERS) {
    fs.mkdirSync(path.join(OUTPUT_DIR, tier.key), { recursive: true });
  }

  const roles = ["top", "jungle", "mid", "bot", "support"];
  const matchupTotals: { role: string; tier: string; count: number }[] = [];

  for (const role of roles) {
    console.log(`\n--- ${role.toUpperCase()} ---`);

    // Get champion list for this role
    let champions: string[];
    let pickRates: Map<string, number>;
    try {
      const result = await fetchRoleChampions(role);
      champions = result.champions;
      pickRates = result.pickRates;
      console.log(
        `Champions from OP.GG: ${champions.length} (${pickRates.size} with pick rates)`,
      );
    } catch (err) {
      console.error(`Failed to get champions for ${role}:`, err);
      continue;
    }

    const uggRole = ROLE_NAMES[role] ?? role;
    const uggRoleKey =
      uggRole === "adc" ? "adc" : uggRole === "support" ? "support" : uggRole;

    // Per-tier matchup accumulators
    const tierData = TIERS.map((t) => ({
      tier: t,
      matchups: [] as Array<{
        champion: string;
        opponent: string;
        winrate: number;
        games: number;
      }>,
      seen: new Set<string>(),
      overviews: new Map<string, UGGOverview>(),
    }));

    for (let i = 0; i < champions.length; i++) {
      const champId = champions[i];
      const slug = champId.toLowerCase();
      process.stdout.write(`  [${i + 1}/${champions.length}] ${champId}...`);

      const html = await fetchUGGPage(slug, uggRole);
      if (!html) {
        console.log(" SKIP (no HTML)");
        if (i < champions.length - 1) await sleep(REQUEST_DELAY);
        continue;
      }

      const counts: string[] = [];
      for (const td of tierData) {
        const entries = extractTierMatchups(html, td.tier.dataKey, uggRoleKey);
        const valid = entries.filter(
          (e) => e.matches >= MIN_GAMES && e.win_rate > 0,
        );

        let added = 0;
        for (const entry of valid) {
          const oppId = keyToId.get(entry.champion_id);
          if (!oppId) continue;

          const key = `${champId}:${oppId}`;
          if (!td.seen.has(key)) {
            td.seen.add(key);
            td.matchups.push({
              champion: champId,
              opponent: oppId,
              winrate: Math.round(entry.win_rate * 100) / 100,
              games: entry.matches,
            });
            added++;
          }
        }

        // Extract overview stats (win_rate, pick_rate, ban_rate)
        const overview = extractTierOverview(html, td.tier.dataKey, uggRoleKey);
        if (overview) {
          td.overviews.set(champId, overview);
        }

        counts.push(`${td.tier.key}:${added}`);
      }

      console.log(` ${counts.join(", ")}`);

      if (i < champions.length - 1) {
        await sleep(REQUEST_DELAY);
      }
    }

    // Fetch duo synergy data for bot/support
    let duosByTier: Record<string, DuoEntry[]> = {};
    if (role === "bot" || role === "support") {
      duosByTier = await fetchDuoData(
        role,
        champions,
        ddChampions,
        patchShort,
        keyToId,
      );
    }

    // Write one file per tier
    for (const td of tierData) {
      const duos = duosByTier[td.tier.key];

      // Build championMeta from U.GG overview data, fallback to OP.GG pick rates
      const championMeta = champions
        .filter((c) => td.overviews.has(c) || pickRates.has(c))
        .map((c) => {
          const overview = td.overviews.get(c);
          if (overview) {
            return {
              champion: c,
              pickRate: overview.pickRate,
              winRate: overview.winRate,
              banRate: overview.banRate,
            };
          }
          return { champion: c, pickRate: pickRates.get(c)! };
        });

      const dataset = {
        patch: patchShort,
        tier: td.tier.key,
        role,
        champions,
        ...(championMeta.length > 0 ? { championMeta } : {}),
        matchups: td.matchups,
        ...(duos && duos.length > 0 ? { duos } : {}),
      };

      const outPath = path.join(OUTPUT_DIR, td.tier.key, `${role}.json`);
      fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2));

      console.log(
        `  ✓ ${td.tier.key}/${role}: ${champions.length} champs, ${td.matchups.length} matchups${duos ? `, ${duos.length} duos` : ""}`,
      );
      matchupTotals.push({
        role,
        tier: td.tier.key,
        count: td.matchups.length,
      });
    }
  }

  // Sanity check: abort if matchup data is (nearly) empty
  const emptySlots = matchupTotals.filter((t) => t.count === 0);
  if (emptySlots.length > 0) {
    console.error(
      `\n✗ Sanity check failed: ${emptySlots.length}/${matchupTotals.length} tier/role combos have 0 matchups:`,
    );
    for (const slot of emptySlots) {
      console.error(`  - ${slot.tier}/${slot.role}`);
    }
    console.error(
      "Aborting to prevent overwriting existing data with empty results.",
    );
    process.exit(1);
  }

  const totalMatchups = matchupTotals.reduce((sum, t) => sum + t.count, 0);
  console.log(
    `\n✓ Sanity check passed: ${totalMatchups} total matchups across ${matchupTotals.length} tier/role combos`,
  );

  // Fetch Meraki champion info
  const championInfo = await fetchMerakiChampionInfo(ddChampions);
  fs.writeFileSync(CHAMPION_INFO_PATH, JSON.stringify(championInfo, null, 2));
  console.log(`\n  ✓ Champion info → ${CHAMPION_INFO_PATH}`);

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
