import { CoinData } from "@/types/coinData";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(`Rate limited. Retrying in ${delay * Math.pow(2, i)}ms...`);
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
      continue;
    }
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response;
  }
  throw new Error("Max retries reached on 429");
}

export async function useCoinData(
  tickers: string[]
): Promise<Record<string, CoinData>> {
  const coinData: Record<string, CoinData> = {};
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

  if (!apiKey) {
    console.error("CoinGecko API key is missing. Check your .env file.");
  }

for (const ticker of tickers) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // wait 1 second between each request

    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${ticker}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          accept: "application/json",
          ...(apiKey && { x_cg_demo_api_key: apiKey }),
        },
      }
    );

    const data = await response.json();

    coinData[ticker] = {
      current: {
        price: data.market_data.current_price.usd.toString(),
        change24h: data.market_data.price_change_percentage_24h.toString(),
        volume: data.market_data.total_volume.usd.toString(),
        marketCap: data.market_data.market_cap.usd.toString(),
      },
      description: data.description.en.split(".")[0] || "N/A",
      categories: data.categories || [],
      genesisDate: data.genesis_date || null,
      sentiment: {
        upPercentage: data.sentiment_votes_up_percentage || 0,
        downPercentage: data.sentiment_votes_down_percentage || 0,
      },
      links: {
        homepage: data.links.homepage || [],
        blockchainSites: data.links.blockchain_site || [],
        twitter: data.links.twitter_screen_name || "",
        telegram: data.links.telegram_channel_identifier || "",
        reddit: data.links.subreddit_url || "",
        github: data.links.repos_url.github || [],
      },
      marketTrends: {
        ath: data.market_data.ath.usd.toString(),
        athDate: data.market_data.ath_date.usd,
        atl: data.market_data.atl.usd.toString(),
        atlDate: data.market_data.atl_date.usd,
        change7d: data.market_data.price_change_percentage_7d.toString(),
        change14d: data.market_data.price_change_percentage_14d.toString(),
        change30d: data.market_data.price_change_percentage_30d.toString(),
        // Removed change90d — calculated from historical instead
      },
      marketCapRank: data.market_cap_rank || 0,
      tickers:
        data.tickers?.map((t: any) => ({
          base: t.base,
          target: t.target,
          marketName: t.market.name,
          lastPrice: t.last,
          volume: t.volume,
          convertedLastUsd: t.converted_last.usd,
        })) || [],
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko data for ${ticker}:`, error);
  }
}

  return coinData;
}
