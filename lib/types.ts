export type Role = "top" | "jungle" | "mid" | "bot" | "support";

export interface Champion {
  id: string;
  name: string;
  key: string;
  roles: Role[];
}

export interface MatchupData {
  champion: string;
  opponent: string;
  winrate: number;
  games: number;
}

export interface PoolState {
  role: Role;
  champions: string[];
}

export interface GapResult {
  opponent: string;
  bestWinrate: number;
  bestChampion: string | null;
  isGap: boolean;
}

export interface Suggestion {
  champion: string;
  gapsFixed: number;
  matchups: MatchupData[];
}

export interface ChampionMeta {
  champion: string;
  pickRate: number;
}

export interface MatchupDataset {
  patch: string;
  role: Role;
  champions: string[];
  matchups: MatchupData[];
  championMeta?: ChampionMeta[];
}
