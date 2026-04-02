import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import type { Role, MatchupDataset } from "@/lib/types";

export const revalidate = 86400;

const VALID_ROLES = new Set<Role>(["top", "jungle", "mid", "bot", "support"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params;

  if (!VALID_ROLES.has(role as Role)) {
    return NextResponse.json(
      {
        error: `Invalid role: ${role}. Must be one of: ${[...VALID_ROLES].join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "matchups",
      `${role}.json`,
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    const dataset: MatchupDataset = JSON.parse(raw);
    return NextResponse.json(dataset);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
