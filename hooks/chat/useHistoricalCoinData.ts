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

function calculateVolatility(prices: number[][]): number {
  const returns = prices.slice(1).map((p, i) => Math.log(p[1] / prices[i][1]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateAverageVolume(volumes: number[][]): number {
  if (!volumes.length) return 0;
  const total = volumes.reduce((sum, [, volume]) => sum + volume, 0);
  return total / volumes.length;
}

/**
 * Fetches 90-day historical price data, plus 48h intraday range data,
 * and calculates RSI, MACD, SMA, volatility, and average volume.
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
      // Step 1: Fetch 90-day daily data
      const response = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${ticker}/market_chart?vs_currency=usd&days=90&interval=daily`,
        {
          headers: {
            accept: "application/json",
            ...(apiKey && { "x-cg-demo-api-key": apiKey }),
          },
        }
      );

      const data = await response.json();
      const prices = data.prices as number[][];

      if (prices.length < 26) continue;

      const indicators = calculateIndicators(prices);

      // Step 2: Wait 2 seconds before range fetch
      await new Promise((res) => setTimeout(res, 2000));

      const now = Math.floor(Date.now() / 1000);
      const from = now - 2 * 24 * 60 * 60; // 48 hours ago

      const rangeRes = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${ticker}/market_chart/range?vs_currency=usd&from=${from}&to=${now}&precision=full`,
        {
          headers: {
            accept: "application/json",
            ...(apiKey && { "x-cg-demo-api-key": apiKey }),
          },
        }
      );

      const rangeData = await rangeRes.json();
      const intradayPrices = rangeData.prices as number[][];
      const volumes = rangeData.total_volumes as number[][];

      const volatility =
        intradayPrices.length > 10 ? calculateVolatility(intradayPrices) : null;
      const avgVolume =
        volumes.length > 0 ? calculateAverageVolume(volumes) : null;

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
        extended: {
          volatility,
          avgVolume,
        },
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
    }
  }

  return updatedCoinData;
}
