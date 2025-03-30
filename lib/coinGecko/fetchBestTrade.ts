import { fetchWithRetry } from "@/utils/fetchWithRetry";

export async function fetchBestTrade(): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  if (!apiKey) {
    console.error("⚠️ Missing CoinGecko API key.");
    return "Unable to identify the best trade today due to missing API key.";
  }

  try {
    // Step 1: Fetch top 100 coins by market cap with 24h % change and volume
    const res = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      }
    );

    const coins = await res.json();

    if (!Array.isArray(coins) || coins.length === 0) {
      return "No trade opportunities could be identified today.";
    }

    // Sort coins by strong combination of:
    // 24h % gain, 1h momentum, high 24h volume
    const ranked = coins
      .filter((coin) => coin.price_change_percentage_24h > 0)
      .sort((a, b) => {
        const scoreA =
          (a.price_change_percentage_24h ?? 0) +
          (a.price_change_percentage_1h_in_currency ?? 0) +
          Math.log(a.total_volume);
        const scoreB =
          (b.price_change_percentage_24h ?? 0) +
          (b.price_change_percentage_1h_in_currency ?? 0) +
          Math.log(b.total_volume);
        return scoreB - scoreA;
      });

    const best = ranked[0];
    if (!best) {
      return "No standout coin identified for trading today.";
    }

    const {
      name,
      symbol,
      current_price,
      price_change_percentage_24h,
      price_change_percentage_1h_in_currency,
      total_volume,
      market_cap_rank,
    } = best;

    return `

- **Coin:** ${name} (${symbol.toUpperCase()})
- **Current Price:** $${current_price.toFixed(2)}
- **24H Change:** ${price_change_percentage_24h.toFixed(2)}%
- **1H Momentum:** ${
      price_change_percentage_1h_in_currency?.toFixed(2) ?? "N/A"
    }%
- **Volume (24H):** $${Math.round(total_volume).toLocaleString()}
- **Market Cap Rank:** #${market_cap_rank}

    `.trim();
  } catch (err) {
    console.error("❌ Failed to fetch best trade opportunity:", err);
    return "Could not determine the best trade opportunity today.";
  }
}
