import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const normalizeId = (id: string) =>
  id.startsWith("0x") ? id.slice(2).toLowerCase() : id.toLowerCase();

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.getAll("ids[]");

  if (!ids || ids.length === 0) {
    return NextResponse.json(
      { error: "No Pyth IDs provided" },
      { status: 400 }
    );
  }

  try {
    const prices = await Promise.all(
      ids.map(async (id) => {
        const normId = normalizeId(id);
        const price = await redis.get(`price:${normId}`);
        return { id: normId, price };
      })
    );

    return NextResponse.json(prices);
  } catch (error) {
    console.error("❌ Redis fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Redis" },
      { status: 500 }
    );
  }
}
