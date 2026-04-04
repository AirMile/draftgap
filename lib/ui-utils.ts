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
