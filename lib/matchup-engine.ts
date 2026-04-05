import type {
  MatchupData,
  GapResult,
  Suggestion,
  ChampionMeta,
} from "@/lib/types";
import { GAP_THRESHOLD } from "@/lib/constants";

function findMatchup(
  champion: string,
  opponent: string,
  matchups: MatchupData[],
): MatchupData | undefined {
  const direct = matchups.find(
    (m) => m.champion === champion && m.opponent === opponent,
  );
  if (direct) return direct;
  const reverse = matchups.find(
    (m) => m.champion === opponent && m.opponent === champion,
  );
  if (reverse) {
    return {
      champion,
      opponent,
      winrate: Math.round((100 - reverse.winrate) * 10) / 10,
      games: reverse.games,
    };
  }
  return undefined;
}

export function findGaps(
  pool: string[],
  opponents: string[],
  matchups: MatchupData[],
): GapResult[] {
  return opponents.map((opponent) => {
    let bestWinrate = 0;
    let bestChampion: string | null = null;

    for (const champ of pool) {
      const m = findMatchup(champ, opponent, matchups);
      if (m && m.winrate > bestWinrate) {
        bestWinrate = m.winrate;
        bestChampion = champ;
      }
    }

    return {
      opponent,
      bestWinrate,
      bestChampion,
      isGap: bestWinrate <= GAP_THRESHOLD,
    };
  });
}

export function suggestChampions(
  pool: string[],
  gapOpponents: string[],
  matchups: MatchupData[],
  candidates: string[],
  gaps: GapResult[] = [],
  championMeta: ChampionMeta[] = [],
): Suggestion[] {
  const gapMap = new Map(gaps.map((g) => [g.opponent, g.bestWinrate]));
  const pickRateMap = new Map(
    championMeta.map((m) => [m.champion, m.pickRate]),
  );
  const nonPool = candidates.filter((c) => !pool.includes(c));

  const suggestions: Suggestion[] = nonPool
    .map((champion) => {
      const relevantMatchups = gapOpponents
        .map((opp) => {
          const m = findMatchup(champion, opp, matchups);
          if (!m) return undefined;
          const current = gapMap.get(opp) ?? 0;
          return m.winrate > current ? m : undefined;
        })
        .filter((m): m is MatchupData => m !== undefined);

      const gapsFixed = relevantMatchups.filter(
        (m) => m.winrate > GAP_THRESHOLD,
      ).length;

      return { champion, gapsFixed, matchups: relevantMatchups };
    })
    .filter((s) => s.gapsFixed > 0)
    .sort((a, b) => {
      if (b.gapsFixed !== a.gapsFixed) return b.gapsFixed - a.gapsFixed;
      // Tiebreaker: winrate increase weighted by opponent pick rate
      const weightedA = a.matchups.reduce((sum, m) => {
        const current = gapMap.get(m.opponent) ?? 0;
        const pickRate = pickRateMap.get(m.opponent) ?? 1;
        return sum + Math.max(0, m.winrate - current) * pickRate;
      }, 0);
      const weightedB = b.matchups.reduce((sum, m) => {
        const current = gapMap.get(m.opponent) ?? 0;
        const pickRate = pickRateMap.get(m.opponent) ?? 1;
        return sum + Math.max(0, m.winrate - current) * pickRate;
      }, 0);
      return weightedB - weightedA;
    })
    .slice(0, 5);

  return suggestions;
}

export function suggestImprovements(
  pool: string[],
  gaps: GapResult[],
  matchups: MatchupData[],
  candidates: string[],
): Suggestion[] {
  const weakest = [...gaps]
    .sort((a, b) => a.bestWinrate - b.bestWinrate)
    .slice(0, 10);

  const nonPool = candidates.filter((c) => !pool.includes(c));

  return nonPool
    .map((champion) => {
      const relevantMatchups: MatchupData[] = [];

      for (const weak of weakest) {
        const m = findMatchup(champion, weak.opponent, matchups);
        if (m && m.winrate > weak.bestWinrate) {
          relevantMatchups.push(m);
        }
      }

      return {
        champion,
        gapsFixed: relevantMatchups.length,
        matchups: relevantMatchups,
      };
    })
    .filter((s) => s.gapsFixed > 0)
    .sort((a, b) => b.gapsFixed - a.gapsFixed)
    .slice(0, 5);
}

export function rankPoolVsEnemy(
  pool: string[],
  enemy: string,
  matchups: MatchupData[],
): MatchupData[] {
  return pool
    .map((champ) => findMatchup(champ, enemy, matchups))
    .filter((m): m is MatchupData => m !== undefined)
    .sort((a, b) => b.winrate - a.winrate);
}
