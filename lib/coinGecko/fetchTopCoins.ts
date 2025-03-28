// lib/coinGecko/fetchTopCoins.ts

import { connect } from "@/db";
import Crypto from "@/models/crypto.model";

export async function fetchTopCoins(): Promise<string> {
  await connect();

  const topCoins = await Crypto.find()
    .sort({ market_cap: -1 }) // Sort by highest market cap
    .limit(20)
    .lean();

  if (!topCoins.length) {
    return "No top coins found.";
  }

  const formatted = topCoins.map((coin, i) => {
    const price = coin.current_price.toFixed(2);
    const change = coin.price_change_percentage_24h?.toFixed(2) ?? "N/A";
    const vol = coin.total_volume.toLocaleString();
    const rank = i + 1;

    return `${rank}. ${
      coin.name
    } (${coin.symbol.toUpperCase()}) — $${price} | 24h: ${change}% | Rank: #${rank} | Vol: $${vol}`;
  });

  return `### Top 20 Coins by Market Cap\n\n${formatted.join("\n")}`.trim();
}
