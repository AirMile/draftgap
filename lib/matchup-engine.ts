import type { MatchupData, GapResult, Suggestion } from "@/lib/types";

const GAP_THRESHOLD = 48;

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

export function bestPick(
  pool: string[],
  opponent: string,
  matchups: MatchupData[],
): string | null {
  let best: { champion: string; winrate: number; games: number } | null = null;

  for (const champ of pool) {
    const m = findMatchup(champ, opponent, matchups);
    if (!m) continue;
    if (
      !best ||
      m.winrate > best.winrate ||
      (m.winrate === best.winrate && m.games > best.games)
    ) {
      best = { champion: champ, winrate: m.winrate, games: m.games };
    }
  }

  return best?.champion ?? null;
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
): Suggestion[] {
  const nonPool = candidates.filter((c) => !pool.includes(c));

  const suggestions: Suggestion[] = nonPool
    .map((champion) => {
      const relevantMatchups = gapOpponents
        .map((opp) => findMatchup(champion, opp, matchups))
        .filter((m): m is MatchupData => m !== undefined);

      const gapsFixed = relevantMatchups.filter(
        (m) => m.winrate > GAP_THRESHOLD,
      ).length;

      return { champion, gapsFixed, matchups: relevantMatchups };
    })
    .filter((s) => s.gapsFixed > 0)
    .sort((a, b) => b.gapsFixed - a.gapsFixed)
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
      let improved = 0;
      const relevantMatchups: MatchupData[] = [];

      for (const weak of weakest) {
        const m = findMatchup(champion, weak.opponent, matchups);
        if (m) {
          relevantMatchups.push(m);
          if (m.winrate > weak.bestWinrate) {
            improved++;
          }
        }
      }

      return { champion, gapsFixed: improved, matchups: relevantMatchups };
    })
    .filter((s) => s.gapsFixed > 0)
    .sort((a, b) => b.gapsFixed - a.gapsFixed)
    .slice(0, 5);
}

export function bestBlindPick(
  pool: string[],
  opponents: string[],
  matchups: MatchupData[],
): { champion: string; avgWinrate: number } | null {
  let best: { champion: string; avgWinrate: number } | null = null;

  for (const champ of pool) {
    const champMatchups = opponents
      .map((opp) => findMatchup(champ, opp, matchups))
      .filter((m): m is MatchupData => m !== undefined);

    if (champMatchups.length === 0) continue;

    const avgWinrate =
      Math.round(
        (champMatchups.reduce((sum, m) => sum + m.winrate, 0) /
          champMatchups.length) *
          10,
      ) / 10;

    if (!best || avgWinrate > best.avgWinrate) {
      best = { champion: champ, avgWinrate };
    }
  }

  return best;
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
