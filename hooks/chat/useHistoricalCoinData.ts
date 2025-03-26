import { CoinData } from "@/types/coinData";
import { calculateIndicators } from "./calculateIndicators";
import { detectSupportResistance } from "./detectSupportResistance";

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

function calculateAverageVolume(volumes: number[][]): number {
  if (!volumes.length) return 0;
  const total = volumes.reduce((sum, [, volume]) => sum + volume, 0);
  return total / volumes.length;
}

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
      const now = Math.floor(Date.now() / 1000);
      const from90d = now - 90 * 24 * 60 * 60;

      // 1. Fetch 90-day high resolution price data (5 min intervals)
      const rangeRes = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${ticker}/market_chart/range?vs_currency=usd&from=${from90d}&to=${now}&precision=full`,
        {
          headers: {
            accept: "application/json",
            "x-cg-demo-api-key": apiKey,
          },
        }
      );

      const rangeData = await rangeRes.json();
      const prices = rangeData.prices as number[][];
      const volumes = rangeData.total_volumes as number[][];

      if (prices.length < 100) continue;

      const currentVolume =
        parseFloat(updatedCoinData[ticker]?.current?.volume ?? "0") ||
        undefined;
      const avgVolume = volumes.length ? calculateAverageVolume(volumes) : null;

      // 2. Indicators from daily and 4h compressed candles
      const compressPrices = (intervalMinutes: number): number[][] => {
        const bucketed: Record<number, number[]> = {};
        const result: number[][] = [];
        for (const [timestamp, price] of prices) {
          const bucket = Math.floor(timestamp / (intervalMinutes * 60 * 1000));
          bucketed[bucket] = [...(bucketed[bucket] || []), price];
        }
        for (const key in bucketed) {
          const ts = parseInt(key) * intervalMinutes * 60 * 1000;
          const close = bucketed[key].at(-1)!;
          result.push([ts, close]);
        }
        return result.sort((a, b) => a[0] - b[0]);
      };

      const daily = compressPrices(1440);
      const fourHour = compressPrices(240);

      const dailyIndicators = calculateIndicators(
        daily,
        volumes,
        currentVolume
      );
      const fourHourIndicators = calculateIndicators(
        fourHour,
        volumes,
        currentVolume
      );

      // 3. Detect Support/Resistance Zones
      const { resistanceLevels, supportLevels } = detectSupportResistance(
        prices,
        volumes
      );

      updatedCoinData[ticker].historical = {
        prices,
        volumes,
        summary: `90-day range: $${Math.min(...prices.map((p) => p[1])).toFixed(
          2
        )} - $${Math.max(...prices.map((p) => p[1])).toFixed(2)}`,
        technical: {
          daily: dailyIndicators,
          fourHour: fourHourIndicators,
        },
        extended: {
          avgVolume,
          volatility: dailyIndicators.volatility ?? null,
        },
        supportResistance: {
          resistanceLevels,
          supportLevels,
        },
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
    }
  }

  return updatedCoinData;
}
