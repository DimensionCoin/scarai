import { NextResponse } from "next/server";
import { connect } from "@/db";
import CoinList from "@/models/coinlist.model";

export async function GET(req: Request) {
  try {
    await connect();

    // Get query parameters from the request
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase() || "";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Search for matching coins
    const coins = await CoinList.find({
      $or: [
        { name: { $regex: query, $options: "i" } }, // Case-insensitive search by name
        { symbol: { $regex: query, $options: "i" } }, // Case-insensitive search by symbol
      ],
    }).limit(20); // Limit results

    return NextResponse.json(coins, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching coin list:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin list" },
      { status: 500 }
    );
  }
}
