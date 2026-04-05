export type Role = "top" | "jungle" | "mid" | "bot" | "support";

export type Tier = "emerald_plus" | "platinum_plus" | "overall";

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

export interface DuoData {
  champion: string;
  partner: string;
  winrate: number;
  games: number;
}

export interface MatchupDataset {
  patch: string;
  tier: Tier;
  role: Role;
  champions: string[];
  matchups: MatchupData[];
  championMeta?: ChampionMeta[];
  duos?: DuoData[];
}

export interface ChampionInfo {
  id: string;
  adaptiveType: "PHYSICAL_DAMAGE" | "MAGIC_DAMAGE";
  attackType: "MELEE" | "RANGED";
  roles: string[];
  damageRating: number;
  toughnessRating: number;
  controlRating: number;
  mobilityRating: number;
}
