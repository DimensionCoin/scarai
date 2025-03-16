import { NextResponse } from "next/server";
import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coinId = searchParams.get("coinId");
    const userId = searchParams.get("userId");

    console.log(`Fetching coin data for coinId: ${coinId}, userId: ${userId}`);

    if (!coinId || !userId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Check user credits
    const hasCredits = await hasEnoughCredits(userId, 1);
    console.log(`User ${userId} has enough credits: ${hasCredits}`);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    // Validate API key
    const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    if (!apiKey) {
      console.error("Missing CoinGecko API key");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Fetch coin data from CoinGecko
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    console.log(`Fetching from CoinGecko: ${url}`);
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `CoinGecko response failed: ${response.status} - ${errorText}`
      );
      throw new Error("Failed to fetch coin data");
    }

    const coinData = await response.json();

    // Deduct credits after successful fetch
    await deductCredits(userId, 1);
    console.log(`Deducted 1 credit for user ${userId}`);

    return NextResponse.json({ coin: coinData }, { status: 200 });
  } catch (error: unknown) {
    // Changed to 'unknown'
    // Handle the error as an Error type safely
    if (error instanceof Error) {
      console.error(`API Error: ${error.message}`, error.stack);
    } else {
      console.error("API Error: An unknown error occurred", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch coin data" },
      { status: 500 }
    );
  }
}
