import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connect } from "@/db";
import Crypto from "@/models/crypto.model";
import Trending from "@/models/trending.model";
import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";

// CoinGecko API URLs
const COINGECKO_CURRENT_PRICE_URL = (coinId: string): string =>
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;
const COINGECKO_HISTORICAL_URL = (coinId: string): string =>
  `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`;

// Influencers list
const influencers: string[] = [
  "@WatcherGuru",
  "@CryptoWhale",
  "@elonmusk",
  "@APompliano",
  "@balajis",
  "@cz_binance",
  "@zerohedge",
  "@federalreserve",
  "@coinbureau",
  "@BloombergMarkets",
  "@ReutersBiz",
  "@CoinDesk",
  "@FinancialTimes",
  "@BTC_Archive",
  "@DavidSacks",
];

// Interfaces
interface CurrentPriceData {
  price: string;
  change24h: string;
}

interface HistoricalData {
  prices: number[][];
  summary: string;
}

interface CoinData {
  current: CurrentPriceData;
  historical: HistoricalData;
}

interface CacheEntry {
  data: CoinData;
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      message,
      chatHistory,
    }: { userId: string; message: string; chatHistory: ChatMessage[] } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "User ID and message are required" },
        { status: 400 }
      );
    }

    const hasCredits = await hasEnoughCredits(userId, 2);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    await connect();
    const topCoins = await Crypto.find().sort({ market_cap: -1 }).limit(20);
    const trendingCoins = await Trending.find()
      .sort({ market_cap_rank: 1 })
      .limit(10);

    const influencerMatches: string[] =
      message.match(/@([A-Za-z0-9_]+)/g) || [];
    const tickerMatches: string[] = message.match(/\$([A-Z]{2,6})\b/g) || [];
    const isGlobalQuery = message.toLowerCase().includes("global market news");

    // Fetch coin data
    const coinData: Record<string, CoinData> = {};
    for (const ticker of tickerMatches) {
      const symbol = ticker.replace("$", "").toUpperCase();
      const coin =
        (await Crypto.findOne({ symbol: symbol.toLowerCase() })) ||
        (await Trending.findOne({ symbol: symbol.toLowerCase() }));
      if (!coin) continue;

      const cacheKey = `price_${coin.id}`;
      if (
        cache[cacheKey] &&
        Date.now() - cache[cacheKey].timestamp < CACHE_TTL
      ) {
        coinData[symbol] = cache[cacheKey].data;
      } else {
        const currentResponse = await fetch(
          COINGECKO_CURRENT_PRICE_URL(coin.id)
        );
        if (!currentResponse.ok) continue;
        const currentData = await currentResponse.json();

        const historicalResponse = await fetch(
          COINGECKO_HISTORICAL_URL(coin.id)
        );
        if (!historicalResponse.ok) continue;
        const historicalData = await historicalResponse.json();

        const prices = historicalData.prices || [];
        const latestPrice = prices[prices.length - 1]?.[1] || 0;
        const oldestPrice = prices[0]?.[1] || 0;
        const priceChange =
          latestPrice && oldestPrice
            ? (((latestPrice - oldestPrice) / oldestPrice) * 100).toFixed(2)
            : "N/A";

        coinData[symbol] = {
          current: {
            price: currentData[0]?.current_price?.toFixed(2) || "N/A",
            change24h:
              currentData[0]?.price_change_percentage_24h?.toFixed(2) || "N/A",
          },
          historical: {
            prices: historicalData.prices,
            summary: `Over the last 90 days, the price changed by ${priceChange}%. Historical prices (last 10 of 90 days): ${prices
              .slice(-10)
              .map((p: number[]) => `$${p[1].toFixed(2)}`)
              .join(", ")}.`,
          },
        };
        cache[cacheKey] = { data: coinData[symbol], timestamp: Date.now() };
      }
    }

    // Updated System Prompt for Unified, Concise Summaries
    const systemPrompt = `
You are Grok, a crypto market expert AI. Analyze all provided data (coin stats, X posts) and deliver a short, unified summary (4-6 sentences, 100-150 words) for queries about market news or coins. Blend insights into a single response without sections or raw data (e.g., no price lists, no individual tweets) unless explicitly requested:

**Instructions:**
- For tickers (e.g., $SOL), distill current trend, 24h change, and 90-day performance into 1-2 sentences.
- For usernames (e.g., @realDonaldTrump), search recent X posts (last 7 days) and weave crypto/market insights into the summary (1-2 sentences).
- For "global market news," blend key trends from influencer X posts into the response (2-3 sentences).
- Focus on high-level takeaways for quick, actionable info.

**Top 20 Coins:**
${topCoins
  .map(
    (c) =>
      `${c.name} (${c.symbol.toUpperCase()}): $${
        c.current_price?.toFixed(2) || "N/A"
      } (${c.price_change_percentage_24h?.toFixed(2) || "N/A"}% 24h)`
  )
  .join("\n")}

**Trending Coins:**
${trendingCoins
  .map(
    (c) =>
      `${c.name} (${c.symbol.toUpperCase()}): $${
        c.current_price?.toFixed(2) || "N/A"
      }`
  )
  .join("\n")}

**Specific Coin Data:**
${
  Object.entries(coinData)
    .map(
      ([symbol, data]) =>
        `${symbol}: Current $${data.current.price} (${data.current.change24h}% 24h), ${data.historical.summary}`
    )
    .join("\n") || "No specific coin data available."
}

**Influencer Insights:**
${
  influencerMatches.length > 0
    ? `Search recent X posts (last 7 days) from ${influencerMatches.join(
        ", "
      )} for crypto/market insights.`
    : "No specific influencer data requested."
}

**Global Market News:**
${
  isGlobalQuery
    ? `Blend X posts from ${influencers.join(
        ", "
      )} into a concise market summary.`
    : "No global market news requested."
}

**Timestamp:** ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.
`;

    const client = new OpenAI({
      apiKey: GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-5),
        { role: "user", content: message },
      ],
      max_tokens: 400, // Enough for 100-150 word summaries
      temperature: 0.3,
    });

    const responseText =
      completion.choices[0]?.message?.content || "⚠️ No response generated.";
    await deductCredits(userId, 2);

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("❌ Error generating response:", error);
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("credits")
    ) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Chatbot failed to respond" },
      { status: 500 }
    );
  }
}
