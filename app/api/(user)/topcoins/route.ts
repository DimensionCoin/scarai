// /app/api/topcoins/route.ts
import { NextResponse } from "next/server";
import { getUserTopCoins, updateUserTopCoins } from "@/actions/user.actions";

// GET: Fetch the user's top coins
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get("clerkId");

  if (!clerkId) {
    return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
  }

  try {
    const topCoins = await getUserTopCoins(clerkId);
    return NextResponse.json({ topCoins });
  } catch (error: unknown) {
    console.error("Error fetching top coins:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch top coins";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Update the user's top coins
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clerkId, topCoins } = body;
    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }
    if (!Array.isArray(topCoins) || topCoins.length > 3) {
      return NextResponse.json(
        { error: "Invalid topCoins data" },
        { status: 400 }
      );
    }
    const updatedTopCoins = await updateUserTopCoins(clerkId, topCoins);
    return NextResponse.json({ topCoins: updatedTopCoins });
  } catch (error: unknown) {
    console.error("Error updating top coins:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update top coins";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
