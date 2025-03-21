import { CoinData } from "@/types/coinData";
import { calculateIndicators } from "./calculateIndicators";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      console.warn(
        `Rate limited for ${url}. Retrying in ${delay * Math.pow(2, i)}ms...`
      );
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

/**
 * Fetches 90-day historical price data and calculates RSI, MACD, and SMA.
 * Assumes tickers have already been extracted by the caller.
 */
export async function useHistoricalCoinData(
  tickers: string[],
  coinData: Record<string, CoinData>
): Promise<Record<string, CoinData>> {
  const updatedCoinData: Record<string, CoinData> = { ...coinData };
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

  if (!apiKey) {
    console.error("CoinGecko API key is missing.");
    return updatedCoinData;
  }

  for (const ticker of tickers) {
    if (!updatedCoinData[ticker]) continue;
    if (updatedCoinData[ticker].historical) continue;

    try {
      const response = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${ticker}/market_chart?vs_currency=usd&days=90&interval=daily`,
        {
          headers: {
            accept: "application/json",
            ...(apiKey && { x_cg_demo_api_key: apiKey }),
          },
        }
      );

      const data = await response.json();
      const prices = data.prices as number[][];

      if (prices.length < 26) continue;

      const indicators = calculateIndicators(prices);

      updatedCoinData[ticker].historical = {
        prices,
        summary: `90-day range: $${Math.min(...prices.map((p) => p[1])).toFixed(
          2
        )} - $${Math.max(...prices.map((p) => p[1])).toFixed(2)}`,
        technicals: {
          rsi: indicators.rsi,
          macd: indicators.macd,
          sma: indicators.sma,
        },
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
    }
  }

  return updatedCoinData;
}
