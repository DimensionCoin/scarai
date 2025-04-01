import { fetchWithRetry } from "@/utils/fetchWithRetry";

const BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  total_volume: number;
  price_change_percentage_7d_in_currency: number;
}

export async function fetchMoonshotCandidates(): Promise<string> {
  try {
    const res = await fetchWithRetry(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1&price_change_percentage=7d`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY || "",
        },
      }
    );

    const coins: CoinMarketData[] = await res.json();

    const strongCandidates = coins
      .filter(
        (coin) =>
          coin.total_volume > 10_000_000 &&
          coin.price_change_percentage_7d_in_currency > 10
      )
      .sort(
        (a, b) =>
          b.price_change_percentage_7d_in_currency -
          a.price_change_percentage_7d_in_currency
      );

    const finalPicks: CoinMarketData[] = [...strongCandidates];

    if (finalPicks.length < 3) {
      const fillerCoins = coins
        .filter((coin) => !finalPicks.includes(coin))
        .sort(
          (a, b) =>
            b.price_change_percentage_7d_in_currency -
            a.price_change_percentage_7d_in_currency
        );

      for (const coin of fillerCoins) {
        if (finalPicks.length >= 3) break;
        finalPicks.push(coin);
      }
    }

    const summary = finalPicks
      .slice(0, 3)
      .map(
        (coin) =>
          `- ${
            coin.name
          } (${coin.symbol.toUpperCase()}): ${coin.price_change_percentage_7d_in_currency.toFixed(
            1
          )}% in 7d, $${(coin.total_volume / 1_000_000).toFixed(1)}M volume`
      )
      .join("\n");

    return `The following coins show strong 7-day performance with high trading volume:\n${summary}`;
  } catch (err) {
    console.error("❌ Error fetching moonshot candidates:", err);
    return "Error fetching moonshot candidates.";
  }
}
