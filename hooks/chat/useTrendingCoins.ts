import { connect } from "@/db";
import Trending from "@/models/trending.model";

export async function useTrendingCoins() {
  await connect();
  const trending = await Trending.find()
    .sort({ market_cap_rank: 1 })
    .limit(10)
    .lean(); // Lean for plain JS objects
  return trending.map((coin) => ({
    id: coin.coin_id, // Use coin_id (e.g., "koma-inu") instead of _id
    name: coin.name, // "Koma Inu"
    marketCapRank: coin.market_cap_rank, // 983
    symbol: coin.symbol, // "KOMA"
  }));
}
