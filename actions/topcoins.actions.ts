"use server";

import Crypto, { ICrypto, ICryptoPlain } from "@/models/crypto.model";
import { connect } from "@/db";

export async function getTopCoins(
  limit?: number // Make limit optional
): Promise<{ lastUpdated: string | null; data: ICryptoPlain[] }> {
  try {
    await connect();
    const query = Crypto.find().sort({ market_cap: -1 });
    if (limit !== undefined) query.limit(limit); // Apply limit only if provided
    const cryptos = await query.lean();

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

    const lastUpdated =
      cryptos.length > 0
        ? cryptos[0].updatedAt instanceof Date
          ? cryptos[0].updatedAt.toISOString()
          : cryptos[0].updatedAt
        : null;

    return {
      lastUpdated,
      data: serializedCryptos,
    };
  } catch (error) {
    console.error("❌ Error fetching top coins:", error);
    throw new Error("Failed to fetch top coins");
  }
}

export async function getCoinById(
  coinId: string
): Promise<ICryptoPlain | null> {
  try {
    await connect();
    const coin = await Crypto.findOne({ id: coinId }).lean();
    if (!coin) return null;

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      price_change_percentage_7d: coin.price_change_percentage_7d,
      createdAt:
        coin.createdAt instanceof Date
          ? coin.createdAt.toISOString()
          : coin.createdAt,
      updatedAt:
        coin.updatedAt instanceof Date
          ? coin.updatedAt.toISOString()
          : coin.updatedAt,
    };
  } catch (error) {
    console.error("❌ Error fetching coin by ID:", error);
    throw new Error(`Failed to fetch coin with ID: ${coinId}`);
  }
}
