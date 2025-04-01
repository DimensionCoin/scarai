import { calculateIndicators } from "./calculateIndicators";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

function getChange(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const start = prices[prices.length - period];
  const end = prices[prices.length - 1];
  return ((end - start) / start) * 100;
}

export async function calculateMarketPerformance(): Promise<string> {
  try {

    if (!COINGECKO_API_KEY) {
      throw new Error("\u274c Missing CoinGecko API key.");
    }

    const now = Math.floor(Date.now() / 1000);
    const from = now - 30 * 24 * 60 * 60;

    const headers = {
      accept: "application/json",
      "x-cg-demo-api-key": COINGECKO_API_KEY,
    };

    // BTC
    const btcUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${now}&precision=full`;

    const btcRes = await fetchWithRetry(btcUrl, { headers }, 3, 500);

    if (!btcRes.ok) {
      const errText = await btcRes.text();
      throw new Error(`\u274c BTC fetch failed: ${btcRes.status} - ${errText}`);
    }

    const btcData = await btcRes.json();
    const btcPrices: number[] = btcData.prices.map(
      ([, price]: [number, number]) => price
    );

    const btc24h = getChange(btcPrices, 2);
    const btc7d = getChange(btcPrices, 8);
    const btc30d = getChange(btcPrices, 30);

    const btcIndicators = calculateIndicators(
      btcData.prices as [number, number][],
      btcData.total_volumes as [number, number][]
    );

    // SPX
    const spxUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=3mo&interval=1d`;

    const spxRes = await fetchWithRetry(spxUrl, {}, 3, 500);

    if (!spxRes.ok) {
      const errText = await spxRes.text();
      throw new Error(`\u274c SPX fetch failed: ${spxRes.status} - ${errText}`);
    }

    const spxJson = await spxRes.json();
    const spxPrices: number[] =
      spxJson.chart.result[0].indicators.quote[0].close.filter(
        (v: number) => typeof v === "number"
      );
    const timestamps: number[] = spxJson.chart.result[0].timestamp;

    
    const spx24h = getChange(spxPrices, 2);
    const spx7d = getChange(spxPrices, 8);
    const spx30d = getChange(spxPrices, 22);

    const spxCandleData: [number, number][] = spxPrices.map(
      (p: number, i: number) => [timestamps[i], p]
    );
    const spxIndicators = calculateIndicators(spxCandleData, []);

    return `
### Market Performance

**Bitcoin (BTC)**
- 24h: ${btc24h.toFixed(2)}%
- 7d: ${btc7d.toFixed(2)}%
- 30d: ${btc30d.toFixed(2)}%
- Daily RSI: ${btcIndicators.rsi?.toFixed(1) ?? "N/A"}
- Daily MACD: ${btcIndicators.macd?.macd.toFixed(2) ?? "N/A"} (${
      btcIndicators.macd?.crossover ?? "no signal"
    })

**S&P 500 (SPX)**
- 24h: ${spx24h.toFixed(2)}%
- 7d: ${spx7d.toFixed(2)}%
- 30d: ${spx30d.toFixed(2)}%
- Daily RSI: ${spxIndicators.rsi?.toFixed(1) ?? "N/A"}
- Daily MACD: ${spxIndicators.macd?.macd.toFixed(2) ?? "N/A"} (${
      spxIndicators.macd?.crossover ?? "no signal"
    })
    `.trim();
  } catch (err) {
    console.error("\u274c Error calculating market performance:", err);
    return "Error calculating market performance.";
  }
}
