// app/api/(data)/trading-prediction/route.ts
import { NextResponse } from "next/server";
import axios from "axios"; // No need for AxiosError anymore
import OpenAI from "openai";
import { MACD, SMA, RSI } from "technicalindicators";
import NodeCache from "node-cache";
// Removed Sentiment import since it's unused

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });
// Removed sentimentAnalyzer since Grok handles sentiment

interface TradingPrediction {
  long: number;
  short: number;
}
interface HistoricalData {
  prices: [number, number][];
}
interface Indicators {
  sma5: number;
  sma20: number;
  rsi14: number;
  macd: { macdLine: number; signalLine: number; histogram: number };
}
interface DataForAI {
  currentPrice: number;
  historicalData: number[];
  indicators: { daily: Indicators; fourHour: Indicators };
  tweets: { text: string; sentiment: number }[];
}

const calculateIndicators = (prices: number[]): Indicators => {
  if (prices.length < 14) throw new Error("Insufficient data for indicators");
  const sma5 =
    prices.length >= 5
      ? SMA.calculate({ period: 5, values: prices }).slice(-1)[0]
      : 0;
  const sma20 =
    prices.length >= 20
      ? SMA.calculate({ period: 20, values: prices }).slice(-1)[0]
      : 0;
  const rsi14 = RSI.calculate({ period: 14, values: prices }).slice(-1)[0];
  const macdResults =
    prices.length >= 26
      ? MACD.calculate({
          values: prices,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
        }).slice(-1)[0]
      : { MACD: 0, signal: 0, histogram: 0 };
  return {
    sma5,
    sma20,
    rsi14,
    macd: {
      macdLine: macdResults.MACD ?? 0,
      signalLine: macdResults.signal ?? 0,
      histogram: macdResults.histogram ?? 0,
    },
  };
};

const aggregateToFourHour = (hourlyPrices: [number, number][]): number[] => {
  const fourHourPrices: number[] = [];
  for (let i = 0; i < hourlyPrices.length; i += 4) {
    const slice = hourlyPrices.slice(i, i + 4);
    if (slice.length > 0)
      fourHourPrices.push(
        slice.reduce((sum, [, price]) => sum + price, 0) / slice.length
      );
  }
  return fourHourPrices;
};

async function getXSentiment(
  symbol: string
): Promise<{ text: string; sentiment: number }[]> {
  const cacheKey = `sentiment:${symbol}`;
  const cachedSentiment =
    cache.get<{ text: string; sentiment: number }[]>(cacheKey);
  if (cachedSentiment) return cachedSentiment;

  const sentimentPrompt = `
    Search X for the 5 most recent public posts mentioning "${symbol.toUpperCase()}" (exclude retweets, English only).
    For each post, analyze its sentiment using a simple positive (>0), negative (<0), or neutral (0) score.
    Return a plain JSON array: [{"text": "tweet text", "sentiment": score}, ...] (no markdown, no extra text).
  `;

  try {
    const response = await client.chat.completions.create({
      model: "grok-beta",
      messages: [{ role: "user", content: sentimentPrompt }],
      max_tokens: 500,
      temperature: 0.1,
    });

    const rawContent =
      response.choices[0].message.content ??
      '[{"text": "No recent tweets", "sentiment": 0}]';
    const sentimentData = JSON.parse(stripMarkdown(rawContent));
    cache.set(cacheKey, sentimentData);
    return sentimentData;
  } catch (error: unknown) {
    console.error("Grok sentiment error:", error);
    return [{ text: "Error fetching tweets", sentiment: 0 }];
  }
}

function stripMarkdown(content: string): string {
  return content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .replace(/`/g, "")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toLowerCase();
  if (!symbol)
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });

  try {
    const priceCacheKey = `priceData:${symbol}`;
    let hourlyPrices: [number, number][];
    const cachedPriceData = cache.get<HistoricalData>(priceCacheKey);
    if (cachedPriceData) {
      hourlyPrices = cachedPriceData.prices;
    } else {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart`,
        {
          params: { vs_currency: "usd", days: 90 },
          headers: {
            "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY,
          },
        }
      );
      hourlyPrices = response.data.prices;
      cache.set(priceCacheKey, response.data);
    }

    const dailyPrices = hourlyPrices
      .filter((_, i) => i % 24 === 0)
      .map(([, price]) => price);
    const fourHourPrices = aggregateToFourHour(hourlyPrices);
    const currentPrice = hourlyPrices[hourlyPrices.length - 1][1];
    const dailyIndicators = calculateIndicators(dailyPrices);
    const fourHourIndicators = calculateIndicators(fourHourPrices);

    const tweets = await getXSentiment(symbol);

    const dataForAI: DataForAI = {
      currentPrice,
      historicalData: dailyPrices.slice(-30),
      indicators: { daily: dailyIndicators, fourHour: fourHourIndicators },
      tweets,
    };

    const predictionPrompt = `
      Analyze this data for ${symbol.toUpperCase()}:
      - Current Price: $${currentPrice}
      - 30-day Historical Data: ${JSON.stringify(
        dataForAI.historicalData ?? []
      )}
      - Daily Indicators: ${JSON.stringify(
        dataForAI.indicators.daily ?? {
          sma5: 0,
          sma20: 0,
          rsi14: 0,
          macd: { macdLine: 0, signalLine: 0, histogram: 0 },
        }
      )}
      - 4-Hour Indicators: ${JSON.stringify(
        dataForAI.indicators.fourHour ?? {
          sma5: 0,
          sma20: 0,
          rsi14: 0,
          macd: { macdLine: 0, signalLine: 0, histogram: 0 },
        }
      )}
      - 5 Recent Tweets: ${JSON.stringify(
        tweets.map((t) => ({
          text: t.text ?? "N/A",
          sentiment: t.sentiment ?? 0,
        })) ?? []
      )}

      Use this formula to determine LONG (price increase) or SHORT (price decrease) likelihood over the next week:
      - Base: 50% long, 50% short

      1. Sentiment (30%):
         - Count positive (sentiment > 0) vs. negative (sentiment < 0) tweets out of 5.
         - Positive majority (> 2 positive): +30% long
         - Negative majority (> 2 negative): +30% short
         - Neutral or tie: +15% long, +15% short

      2. Indicators (50%):
         - SMA (20%): sma5 > sma20 = +10% long, sma5 < sma20 = +10% short (both timeframes)
         - RSI (20%): rsi14 > 70 = +10% short, rsi14 < 30 = +10% long (both timeframes)
         - MACD (10%): macdLine > signalLine & histogram > 0 = +10% long, macdLine < signalLine & histogram < 0 = +10% short (daily only)

      3. Historical Price (20%):
         - Volatility: Calculate standard deviation of last 30 days. High (> 10% of avg price) = +10% short (risky), else +5% each
         - Trend: Current price > 30-day avg = +10% long, else +10% short

      Adjust base score (50/50) with these weights. Ensure long + short = 100.

      Return a plain JSON object {"long": X, "short": Y} with no markdown, no code blocks, no backticks, no extra text—only the raw JSON string.
    `;

    const predictionResponse = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: predictionPrompt }],
      max_tokens: 100,
      temperature: 0.1,
    });

    const rawContent =
      predictionResponse.choices[0].message.content ??
      '{"long": 50, "short": 50}';
    const predictionContent = stripMarkdown(rawContent);
    const prediction: TradingPrediction = JSON.parse(predictionContent);

    return NextResponse.json(prediction);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in trading prediction:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
