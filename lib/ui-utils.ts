const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  AurelionSol: "Aurelion Sol",
  Belveth: "Bel'Veth",
  Chogath: "Cho'Gath",
  DrMundo: "Dr. Mundo",
  JarvanIV: "Jarvan IV",
  Kaisa: "Kai'Sa",
  Khazix: "Kha'Zix",
  KogMaw: "Kog'Maw",
  KSante: "K'Sante",
  Leblanc: "LeBlanc",
  LeeSin: "Lee Sin",
  MasterYi: "Master Yi",
  MissFortune: "Miss Fortune",
  Nunu: "Nunu & Willump",
  RekSai: "Rek'Sai",
  Renata: "Renata Glasc",
  TahmKench: "Tahm Kench",
  TwistedFate: "Twisted Fate",
  Velkoz: "Vel'Koz",
  XinZhao: "Xin Zhao",
};

export function formatChampionName(id: string): string {
  return DISPLAY_NAME_OVERRIDES[id] ?? id;
}

export function winrateColor(wr: number): string {
  if (wr >= 52) return "text-win";
  if (wr > 48) return "text-neutral";
  return "text-loss";
}

export function winrateBg(wr: number): string {
  if (wr >= 52) return "bg-win/10";
  if (wr > 48) return "bg-neutral/10";
  return "bg-loss/10";
}
