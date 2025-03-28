import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { calculateIndicators } from "../indicators/calculateIndicators";
import { detectSupportResistance } from "../indicators/detectSupportResistance";

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatUtcToLocal(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export async function fetchCoinPriceHistory(slugRaw: string): Promise<string> {
  const slug = typeof slugRaw === "string" ? slugRaw.replace("/", "") : "";
  const displayName = toTitleCase(slug);

  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  if (!apiKey) {
    console.error("⚠️ Missing CoinGecko API key.");
    return "Price history unavailable.";
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 90 * 24 * 60 * 60;

    const res = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${slug}/market_chart/range?vs_currency=usd&from=${from}&to=${now}&precision=full`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": apiKey,
        },
      }
    );

    const data = await res.json();
    const prices = data.prices as number[][];
    const volumes = data.total_volumes as number[][];

    if (!prices.length || prices.length < 30) {
      return "Insufficient historical data available.";
    }

    const [lastTimestamp, lastPrice] = prices.at(-1)!;
    const lastUpdated = formatUtcToLocal(lastTimestamp);

    const low = Math.min(...prices.map(([, p]) => p));
    const high = Math.max(...prices.map(([, p]) => p));
    const changePercent =
      (((lastPrice ?? 0) - prices[0][1]) / prices[0][1]) * 100;

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

    const indicatorsDaily = calculateIndicators(daily, volumes);
    const indicators4h = calculateIndicators(fourHour, volumes);

    const { supportLevels, resistanceLevels, weakSupport, weakResistance } =
      detectSupportResistance(prices, volumes);

    const formatLevels = (levels?: number[]) =>
      levels?.length ? levels.map((v) => `$${v.toFixed(2)}`).join(", ") : "N/A";

    return `
**Technical Analysis for ${displayName}**

- Last Updated Price: $${lastPrice.toFixed(2)} (as of ${lastUpdated})
- Price Range: $${low.toFixed(2)} - $${high.toFixed(2)} (last 90 days)
- Change: ${changePercent.toFixed(2)}%

**Support & Resistance**
- Strong Support: ${formatLevels(supportLevels)}
- Weak Support: ${formatLevels(weakSupport)}
- Strong Resistance: ${formatLevels(resistanceLevels)}
- Weak Resistance: ${formatLevels(weakResistance)}

**Indicators (Daily)**
- RSI: ${indicatorsDaily.rsi?.toFixed(1) ?? "N/A"}
- MACD: ${indicatorsDaily.macd?.macd.toFixed(2) ?? "N/A"} (${
      indicatorsDaily.macd?.crossover || "no signal"
    })
- SMA20: $${indicatorsDaily.sma?.sma20.toFixed(2) ?? "N/A"}
- Confidence: ${indicatorsDaily.confidence}

**Indicators (4H)**
- RSI: ${indicators4h.rsi?.toFixed(1) ?? "N/A"}
- MACD: ${indicators4h.macd?.macd.toFixed(2) ?? "N/A"} (${
      indicators4h.macd?.crossover || "no signal"
    })
- SMA20: $${indicators4h.sma?.sma20.toFixed(2) ?? "N/A"}
- Confidence: ${indicators4h.confidence}
    `.trim();
  } catch (err) {
    console.error(`❌ Failed to fetch price history for ${slug}`, err);
    return "Failed to fetch price history.";
  }
}
