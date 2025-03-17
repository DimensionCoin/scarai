// app/api/(data)/trading-prediction/route.ts
import { NextResponse } from "next/server";
import axios, { AxiosResponse } from "axios";
import OpenAI from "openai";
import { MACD, SMA, RSI } from "technicalindicators";
import NodeCache from "node-cache";

interface TradingPrediction {
  long: number;
  short: number;
}

interface HistoricalData {
  prices: [number, number][]; // [timestamp, price]
}

interface Indicators {
  sma5: number;
  sma20: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
}

interface DataForAI {
  currentPrice: number;
  historicalData: number[];
  indicators: {
    daily: Indicators;
    fourHour: Indicators;
  };
}

interface MACDInput {
  values: number[];
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  SimpleMAOscillator: boolean;
  SimpleMASignal: boolean;
}

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY || "",
  baseURL: "https://api.x.ai/v1",
});

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

const calculateIndicators = (prices: number[]): Indicators => {
  console.log("Calculating indicators with prices length:", prices.length);

  // Minimum 14 for RSI, adjust if MACD isn’t critical
  if (prices.length < 14)
    throw new Error(
      "Insufficient data for indicators (need at least 14 points)"
    );

  const sma5 =
    prices.length >= 5
      ? SMA.calculate({ period: 5, values: prices }).slice(-1)[0]
      : 0;
  const sma20 =
    prices.length >= 20
      ? SMA.calculate({ period: 20, values: prices }).slice(-1)[0]
      : 0;
  const rsi14 = RSI.calculate({ period: 14, values: prices }).slice(-1)[0];
  const macdInput: MACDInput = {
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macdResults =
    prices.length >= 26
      ? MACD.calculate(macdInput).slice(-1)[0]
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
    if (slice.length > 0) {
      const avgPrice =
        slice.reduce((sum, [, price]) => sum + price, 0) / slice.length;
      fourHourPrices.push(avgPrice);
    }
  }
  return fourHourPrices;
};

export async function GET(request: Request) {
  console.log("Handling GET request to /api/trading-prediction:", request.url);

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json(
      { error: "Symbol is required and must be a string" },
      { status: 400 }
    );
  }

  const normalizedSymbol = symbol.toLowerCase();

  if (!process.env.GROK_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing GROK_API_KEY" },
      { status: 500 }
    );
  }

  const coinGeckoApiKey =
    process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;
  if (!coinGeckoApiKey) {
    console.warn(
      "CoinGecko API key not found in environment variables. Attempting request without key."
    );
  }

  const cacheKey = `priceData:${normalizedSymbol}`;
  let hourlyPrices: [number, number][];

  try {
    const cachedData = cache.get<HistoricalData>(cacheKey);
    if (cachedData) {
      hourlyPrices = cachedData.prices;
    } else {
      const config = {
        params: {
          vs_currency: "usd",
          days: 90, // Fetch 90 days of hourly data
        },
        timeout: 10000,
        headers: coinGeckoApiKey
          ? { "x-cg-demo-api-key": coinGeckoApiKey }
          : undefined,
      };

      const historicalResponse: AxiosResponse<HistoricalData> = await axios
        .get(
          `https://api.coingecko.com/api/v3/coins/${normalizedSymbol}/market_chart`,
          config
        )
        .catch((error) => {
          console.error(
            "CoinGecko API Error:",
            error.response?.data || error.message
          );
          throw error;
        });

      hourlyPrices = historicalResponse.data.prices;
      console.log("Hourly prices length:", hourlyPrices.length);

      if (hourlyPrices.length < 26 * 24) {
        console.warn(
          "Fewer than 26 days of hourly data received:",
          hourlyPrices.length
        );
      }
      cache.set(cacheKey, historicalResponse.data);
    }

    const dailyPrices = hourlyPrices
      .filter((_, i) => i % 24 === 0)
      .map(([, price]) => price);
    console.log("Daily prices length:", dailyPrices.length);

    const fourHourPrices = aggregateToFourHour(hourlyPrices);
    console.log("Four-hour prices length:", fourHourPrices.length);

    const currentPrice = hourlyPrices[hourlyPrices.length - 1][1];

    const dailyIndicators = calculateIndicators(dailyPrices);
    const fourHourIndicators = calculateIndicators(fourHourPrices);

    const dataForAI: DataForAI = {
      currentPrice,
      historicalData: dailyPrices.slice(-30),
      indicators: {
        daily: dailyIndicators,
        fourHour: fourHourIndicators,
      },
    };

    const sentimentPrompt = `
      Search X for tweets about "${normalizedSymbol.toUpperCase()}" from the last 7 days.
      Analyze the sentiment (positive, negative, neutral) and summarize the overall mood.
      Return a summary of the sentiment.
    `;

    const sentimentResponse = await client.chat.completions.create({
      model: "grok-beta",
      messages: [{ role: "user", content: sentimentPrompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const sentimentSummary = sentimentResponse.choices[0].message.content;
    if (!sentimentSummary) {
      throw new Error("Sentiment summary from Grok is empty or null");
    }

    const predictionPrompt = `
      Given the following data for ${normalizedSymbol.toUpperCase()}:
      - Current Price: $${currentPrice}
      - 30-day Historical Data: ${JSON.stringify(dataForAI.historicalData)}
      - Daily Indicators: ${JSON.stringify(dataForAI.indicators.daily)}
      - 4-Hour Indicators: ${JSON.stringify(dataForAI.indicators.fourHour)}
      - Twitter Sentiment (last 7 days): ${sentimentSummary}

      Analyze the data and determine the likelihood of a LONG (price increase) or SHORT (price decrease) position working out over the next week.
      Return ONLY a valid JSON object, with NO markdown text and with exactly two keys: "long" and "short" (both numbers that sum to 100), and nothing else.
    `;

    const predictionResponse = await client.chat.completions.create({
      model: "grok-beta",
      messages: [{ role: "user", content: predictionPrompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const predictionText = predictionResponse.choices[0].message.content;
    if (!predictionText) {
      throw new Error("Prediction text from Grok is empty or null");
    }

    // Extract JSON content if wrapped in markdown code fences
    let jsonString = predictionText.trim();
    if (jsonString.startsWith("```")) {
      const regex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
      const match = jsonString.match(regex);
      if (match && match[1]) {
        jsonString = match[1];
      }
    }

    let prediction: TradingPrediction;
    try {
      prediction = JSON.parse(jsonString);
      if (
        typeof prediction.long !== "number" ||
        typeof prediction.short !== "number" ||
        prediction.long + prediction.short !== 100
      ) {
        throw new Error("Invalid prediction format or percentages");
      }
    } catch (parseError) {
      console.error(
        "JSON Parse Error:",
        parseError,
        "Raw Text:",
        predictionText
      );
      throw new Error("Failed to parse Grok's prediction as valid JSON");
    }

    return NextResponse.json(prediction, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error processing ${normalizedSymbol}:`, error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate trading prediction";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
