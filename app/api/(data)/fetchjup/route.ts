import { NextResponse } from "next/server";
import { connect } from "@/db";
import JupCoin from "@/models/jupcoin.model";

export async function POST(req: Request) {
  try {
    await connect();

    // ✅ Extract addresses from the request body
    const { addresses } = await req.json();

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty addresses array" },
        { status: 400 }
      );
    }

    console.log(`🔎 Fetching data for ${addresses.length} tokens...`);

    // ✅ Query MongoDB for matching tokens
    const tokens = await JupCoin.find({ address: { $in: addresses } });

    console.log(`✅ Found ${tokens.length} matching tokens`);

    return NextResponse.json(tokens, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error fetching JupCoins:", error.message);
    } else {
      console.error("❌ Error fetching JupCoins:", error);
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
