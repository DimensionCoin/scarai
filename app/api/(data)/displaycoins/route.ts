import { NextRequest, NextResponse } from "next/server";
import CoinList, { ICoinList } from "@/models/coinlist.model";
import { connect } from "@/db";

// GET handler to fetch coins
export async function GET(request: NextRequest) {
  try {
    // Connect to database using your existing connect function
    await connect();

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Optional: Add search functionality
    const search = searchParams.get("search") || "";
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { symbol: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetch coins with pagination
    const coins: ICoinList[] = await CoinList.find(query)
      .skip(skip)
      .limit(limit)
      .select("id symbol name image updatedAt")
      .lean();

    // Get total count for pagination
    const totalCoins = await CoinList.countDocuments(query);

    // Return response
    return NextResponse.json({
      success: true,
      data: coins,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCoins / limit),
        totalCoins,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching coins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
