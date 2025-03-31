// lib/coinGecko/fetchCategoryCoins.ts

import { fetchWithRetry } from "@/utils/fetchWithRetry";

type CoinGeckoMarketCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
};

const STABLECOIN_IDS = ["tether", "usd-coin", "usdt", "usdc"];

export async function fetchCategoryCoins(category: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  if (!apiKey) {
    console.error("⚠️ Missing CoinGecko API key.");
    return "Category coin data unavailable.";
  }

  try {
    const res = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${encodeURIComponent(
        category
      )}&order=volume_desc&per_page=25&page=1&sparkline=false&price_change_percentage=1h,24h,7d`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      }
    );

    const coins = await res.json();

    if (!coins?.length) {
      return `No coins found in category: ${category}`;
    }

    // Filter out stablecoins and limit to top 10
    const filtered = (coins as CoinGeckoMarketCoin[])
      .filter(
        (coin) =>
          !STABLECOIN_IDS.includes(coin.id.toLowerCase()) &&
          coin.current_price > 0
      )
      .slice(0, 10);

    const formatted = filtered
      .map((coin, i: number) => {
        const change24h = coin.price_change_percentage_24h?.toFixed(2) ?? "N/A";
        const change7d =
          coin.price_change_percentage_7d_in_currency?.toFixed(2) ?? "N/A";
        return `${i + 1}. ${
          coin.name
        } (${coin.symbol.toUpperCase()}) — $${coin.current_price.toFixed(
          2
        )} | 24h: ${change24h}% | 7d: ${change7d}%`;
      })
      .join("\n");

    return `**Top Coins in Category: ${category.replace(
      /-/g,
      " "
    )}**\n\n${formatted}`;
  } catch (err) {
    console.error(`❌ Failed to fetch category coins for ${category}`, err);
    return "Failed to fetch category coin data.";
  }
}
