import { ICrypto } from "@/models/crypto.model";

const COINGECKO_COIN_URL = (coinId: string) =>
  `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cache: { [key: string]: { data: any; timestamp: number } } = {};

async function fetchWithApiKey(url: string): Promise<Response> {
  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  }
  return fetch(url, { headers });
}

export async function fetchCoinData(coinId: string, dbCoin?: ICrypto | null) {
  const cacheKey = `coin_${coinId}`;
  const cached = cache[cacheKey];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL && !dbCoin) {
    return cached.data;
  }

  let currentData;
  if (dbCoin && Date.now() - new Date(dbCoin.updatedAt).getTime() < CACHE_TTL) {
    currentData = {
      price: dbCoin.current_price?.toFixed(2) || "N/A",
      change24h: dbCoin.price_change_percentage_24h?.toFixed(2) || "N/A",
      volume: dbCoin.total_volume?.toLocaleString() || "N/A",
      marketCap: dbCoin.market_cap?.toLocaleString() || "N/A",
    };
  } else {
    const response = await fetchWithApiKey(COINGECKO_COIN_URL(coinId));
    if (!response.ok)
      throw new Error(`Failed to fetch coin data for ${coinId}`);
    const data = await response.json();
    currentData = {
      price: data.market_data?.current_price?.usd?.toFixed(2) || "N/A",
      change24h:
        data.market_data?.price_change_percentage_24h?.toFixed(2) || "N/A",
      volume: data.market_data?.total_volume?.usd?.toLocaleString() || "N/A",
      marketCap: data.market_data?.market_cap?.usd?.toLocaleString() || "N/A",
    };
  }

  const result = { current: currentData };
  cache[cacheKey] = { data: result, timestamp: Date.now() };
  return result;
}
