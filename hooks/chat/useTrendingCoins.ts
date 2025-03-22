import { connect } from "@/db";
import Trending from "@/models/trending.model";

export async function useTrendingCoins() {
  await connect();
  const trending = await Trending.find()
    .sort({ market_cap_rank: 1 })
    .limit(10)
    .lean(); // Lean for plain JS objects
 return trending.map((coin) => ({
   id: coin.coin_id,
   name: coin.name,
   marketCapRank: coin.market_cap_rank,
   symbol: coin.symbol,
   market_data: {
     price: coin.market_data?.price,
     price_change_percentage_24h: coin.market_data?.price_change_percentage_24h,
     total_volume: coin.market_data?.total_volume,
   },
 }));

}
