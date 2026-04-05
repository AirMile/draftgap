import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import type { Role, Tier, MatchupDataset } from "@/lib/types";

export const revalidate = 86400;

const VALID_ROLES = new Set<Role>(["top", "jungle", "mid", "bot", "support"]);
const VALID_TIERS = new Set<Tier>(["emerald_plus", "platinum_plus", "overall"]);
const DEFAULT_TIER: Tier = "emerald_plus";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params;
  const url = new URL(request.url);
  const tier = (url.searchParams.get("tier") ?? DEFAULT_TIER) as Tier;

  if (!VALID_ROLES.has(role as Role)) {
    return NextResponse.json(
      {
        error: `Invalid role: ${role}. Must be one of: ${[...VALID_ROLES].join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json(
      {
        error: `Invalid tier: ${tier}. Must be one of: ${[...VALID_TIERS].join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Try tier-specific path first, fall back to legacy flat path
  const tierPath = path.join(
    process.cwd(),
    "data",
    "matchups",
    tier,
    `${role}.json`,
  );
  const legacyPath = path.join(
    process.cwd(),
    "data",
    "matchups",
    `${role}.json`,
  );
  const filePath = fs.existsSync(tierPath) ? tierPath : legacyPath;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const dataset: MatchupDataset = JSON.parse(raw);
    return NextResponse.json(dataset);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
