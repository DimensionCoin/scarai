// lib/coinGecko/fetchTrendingCoins.ts

import { connect } from "@/db";
import Trending from "@/models/trending.model";

export async function fetchTrendingCoins(): Promise<string> {
  await connect();

  const trending = await Trending.find()
    .sort({ market_cap_rank: 1 })
    .limit(15)
    .lean();

  if (!trending.length) {
    return "No trending coins found.";
  }

  const blocks = trending.map((coin, i) => {
    return `#${i + 1} ${coin.name} (${coin.symbol.toUpperCase()})
- Price: $${coin.market_data?.price?.toFixed(4) ?? "N/A"}
- 24h Change: ${
      coin.market_data?.price_change_percentage_24h?.toFixed(2) ?? "N/A"
    }%
- Volume: $${coin.market_data?.total_volume?.toLocaleString() ?? "N/A"}
- Market Cap Rank: ${coin.market_cap_rank ?? "N/A"}
`;
  });

  return `### Top 15 Trending Coins\n\n${blocks.join("\n")}`.trim();
}
