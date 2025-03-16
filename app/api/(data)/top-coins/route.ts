import { NextResponse } from "next/server";
import { connect } from "@/db";
import Crypto from "@/models/crypto.model";

export async function GET() {
  try {
    await connect();
    const cryptos = await Crypto.find().sort({ market_cap: -1 }).lean(); // Use lean() for plain objects

    const latestUpdate = cryptos.length > 0 ? cryptos[0].updatedAt : null;

    // Serialize dates to strings
    const serializedCryptos = cryptos.map((crypto) => ({
      id: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      image: crypto.image,
      current_price: crypto.current_price,
      price_change_percentage_24h: crypto.price_change_percentage_24h,
      market_cap: crypto.market_cap,
      total_volume: crypto.total_volume,
      price_change_percentage_7d: crypto.price_change_percentage_7d,
      createdAt:
        crypto.createdAt instanceof Date
          ? crypto.createdAt.toISOString()
          : crypto.createdAt,
      updatedAt:
        crypto.updatedAt instanceof Date
          ? crypto.updatedAt.toISOString()
          : crypto.updatedAt,
    }));

    return NextResponse.json({
      lastUpdated:
        latestUpdate instanceof Date
          ? latestUpdate.toISOString()
          : latestUpdate,
      data: serializedCryptos,
    });
  } catch (error) {
    console.error("❌ Error fetching crypto data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cryptocurrency data" },
      { status: 500 }
    );
  }
}
