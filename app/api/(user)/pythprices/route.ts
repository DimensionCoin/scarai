import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/db";
import PythPrices from "@/models/pythprice.model";
import type { PriceData } from "@/hooks/pyth/usePythPrice"; // ✅ adjust this import if needed

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
    await connect();

    const latestDoc = (await PythPrices.findOne({
      key: "latest",
    }).lean()) as unknown as {
      prices: Record<string, PriceData>;
      updatedAt: Date;
    };

    if (!latestDoc || !latestDoc.prices) {
      return NextResponse.json(
        { error: "No price data available" },
        { status: 404 }
      );
    }

    const prices = ids.map((id) => {
      const normId = normalizeId(id);
      return {
        id: normId,
        price: latestDoc.prices[normId] || null,
      };
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error("❌ Mongo fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch from database" },
      { status: 500 }
    );
  }
}
