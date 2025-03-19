// @/hooks/chat/fetchCoinData.ts
import axios from "axios";
import Crypto from "@/models/crypto.model";

export async function fetchCoinData(coinId: string, dbCoin: any | null) {
  // If dbCoin is null or we want fresh data, fetch from API
  const apiKey = process.env.COINGECKO_API_KEY;
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  try {
    const response = await axios.get(url, {
      headers: { "x-cg-demo-api-key": apiKey },
    });
    const data = response.data;

    // Map API data to CoinData interface
    return {
      current: {
        price: data.market_data.current_price.usd.toString(),
        change24h: data.market_data.price_change_percentage_24h.toString(),
        volume: data.market_data.total_volume.usd.toString(),
        marketCap: data.market_data.market_cap.usd.toString(),
      },
      description: data.description.en || "No description available.",
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
        ath: data.market_data.ath.usd?.toString() || "N/A",
        athDate: data.market_data.ath_date.usd || "N/A",
        atl: data.market_data.atl.usd?.toString() || "N/A",
        atlDate: data.market_data.atl_date.usd || "N/A",
        change7d:
          data.market_data.price_change_percentage_7d?.toString() || "N/A",
        change14d:
          data.market_data.price_change_percentage_14d?.toString() || "N/A",
        change30d:
          data.market_data.price_change_percentage_30d?.toString() || "N/A",
      },
      marketCapRank: data.market_cap_rank || 0,
      tickers: data.tickers
        ? data.tickers.slice(0, 5).map((ticker: any) => ({
            base: ticker.base,
            target: ticker.target,
            marketName: ticker.market.name,
            lastPrice: ticker.last,
            volume: ticker.volume,
            convertedLastUsd: ticker.converted_last.usd,
          }))
        : [],
    };
  } catch (error) {
    console.error(`Error fetching ${coinId} from CoinGecko:`, error);
    return {
      current: {
        price: "N/A",
        change24h: "N/A",
        volume: "N/A",
        marketCap: "N/A",
      },
      description: "No description available.",
      categories: [],
      genesisDate: null,
      sentiment: { upPercentage: 0, downPercentage: 0 },
      links: {
        homepage: [],
        blockchainSites: [],
        twitter: "",
        telegram: "",
        reddit: "",
        github: [],
      },
      marketTrends: {
        ath: "N/A",
        athDate: "N/A",
        atl: "N/A",
        atlDate: "N/A",
        change7d: "N/A",
        change14d: "N/A",
        change30d: "N/A",
      },
      marketCapRank: 0,
      tickers: [],
    };
  }
}
