import { CoinData } from "@/types/coinData";
import { useCoinData } from "./useCoinData";
import { useHistoricalCoinData } from "./useHistoricalCoinData";

/**
 * Unified hook that:
 * 1. Fetches current coin data (description, price, links, etc)
 * 2. Fetches 90-day historical price data
 * 3. Calculates RSI, MACD, SMA from historical data
 */
export async function useUnifiedCoinData(
  tickers: string[]
): Promise<Record<string, CoinData>> {
  // Step 1: Fetch current coin info
  const coinData = await useCoinData(tickers);

  // Step 2: Enrich with historical data + indicators
  const enrichedCoinData = await useHistoricalCoinData(tickers, coinData);

  return enrichedCoinData;
}
