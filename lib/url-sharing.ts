import type { Role, Tier } from "@/lib/types";

const VALID_ROLES: Role[] = ["top", "jungle", "mid", "bot", "support"];
const VALID_TIERS: Tier[] = ["emerald_plus", "platinum_plus", "overall"];
const DEFAULT_TIER: Tier = "emerald_plus";

export function buildShareUrl(
  role: Role,
  champions: string[],
  tier: Tier,
): string {
  const params = new URLSearchParams();
  params.set("role", role);
  params.set("champs", champions.join(","));
  if (tier !== DEFAULT_TIER) {
    params.set("tier", tier);
  }
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/?${params.toString()}`;
}

export function parseShareParams(
  params: URLSearchParams,
): { role: Role; champions: string[]; tier: Tier } | null {
  const role = params.get("role");
  const champs = params.get("champs");

  if (!role || !champs) return null;
  if (!VALID_ROLES.includes(role as Role)) return null;

  const champions = champs
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (champions.length === 0) return null;

  const tierParam = params.get("tier");
  const tier: Tier =
    tierParam && VALID_TIERS.includes(tierParam as Tier)
      ? (tierParam as Tier)
      : DEFAULT_TIER;

  return { role: role as Role, champions, tier };
}
