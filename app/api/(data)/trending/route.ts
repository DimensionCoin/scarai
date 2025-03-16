import { NextResponse } from "next/server";
import {connect} from "@/db"; // Make sure you have a MongoDB connection file
import Trending from "@/models/trending.model";

export async function GET() {
  try {
    await connect(); // Ensure database connection

    const trendingCoins = await Trending.find().sort({ market_cap_rank: 1 });

    return NextResponse.json(trendingCoins, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching trending coins:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending coins" },
      { status: 500 }
    );
  }
}
