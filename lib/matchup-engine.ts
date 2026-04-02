import type { MatchupData, GapResult, Suggestion } from "@/lib/types";

const GAP_THRESHOLD = 48;

export function bestPick(
  pool: string[],
  opponent: string,
  matchups: MatchupData[],
): string | null {
  let best: { champion: string; winrate: number; games: number } | null = null;

  for (const champ of pool) {
    const m = matchups.find(
      (mu) => mu.champion === champ && mu.opponent === opponent,
    );
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
      const m = matchups.find(
        (mu) => mu.champion === champ && mu.opponent === opponent,
      );
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
        .map((opp) =>
          matchups.find((m) => m.champion === champion && m.opponent === opp),
        )
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

export function rankPoolVsEnemy(
  pool: string[],
  enemy: string,
  matchups: MatchupData[],
): MatchupData[] {
  return pool
    .map((champ) =>
      matchups.find((m) => m.champion === champ && m.opponent === enemy),
    )
    .filter((m): m is MatchupData => m !== undefined)
    .sort((a, b) => b.winrate - a.winrate);
}
