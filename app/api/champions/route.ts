import { NextResponse } from "next/server";
import { getChampions } from "@/lib/ddragon";

export const revalidate = 86400; // 24h cache

export async function GET() {
  try {
    const champions = await getChampions();
    return NextResponse.json(champions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
