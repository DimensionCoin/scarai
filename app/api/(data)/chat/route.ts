import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connect } from "@/db";
import Crypto, { ICrypto } from "@/models/crypto.model";
import Trending from "@/models/trending.model";
import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";

// CoinGecko API URLs
const COINGECKO_COIN_URL = (coinId: string): string =>
  `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`;

const COINGECKO_HISTORICAL_URL = (coinId: string): string =>
  `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`;

const COINGECKO_COIN_LIST_URL = "https://api.coingecko.com/api/v3/coins/list";

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
  isTrending?: boolean;
}

interface CacheEntry {
  data: CoinData;
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

// Load CoinGecko API key
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
if (!COINGECKO_API_KEY) {
  console.warn("NEXT_PUBLIC_COINGECKO_API_KEY not found in .env. Using unauthenticated requests.");
}

async function fetchWithApiKey(url: string): Promise<Response> {
  const headers: HeadersInit = { accept: "application/json" };
  if (COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
    console.log(`Using CoinGecko API key: ${COINGECKO_API_KEY.slice(0, 6)}... for ${url}`);
  }
  return fetch(url, { headers });
}

async function fetchCoinIdByNameOrSymbol(input: string): Promise<string | null> {
  console.log(`Fetching CoinGecko ID for input: ${input}`);
  const response = await fetchWithApiKey(COINGECKO_COIN_LIST_URL);
  if (!response.ok) {
    console.error(`Failed to fetch CoinGecko coin list: ${response.status}`);
    return null;
  }
  const coinList: CoinGeckoCoin[] = await response.json();
  const coin =
    coinList.find((c) => c.id.toLowerCase() === input.toLowerCase()) ||
    coinList.find((c) => c.symbol.toUpperCase() === input.toUpperCase());
  if (coin) {
    console.log(`CoinGecko ID found: ${coin.id} for input: ${input}`);
  } else {
    console.log(`No CoinGecko ID found for input: ${input}`);
  }
  return coin ? coin.id : null;
}

async function fetchCurrentData(coinId: string): Promise<CurrentPriceData> {
  console.log(`Fetching current data for ${coinId}`);
  const response = await fetchWithApiKey(COINGECKO_COIN_URL(coinId));
  if (!response.ok) {
    console.error(`CoinGecko fetch failed for ${coinId}: ${response.status}`);
    return { price: "N/A", change24h: "N/A" };
  }
  const data = await response.json();
  if (!data || !data.market_data) {
    console.error(`No market data for ${coinId}`);
    return { price: "N/A", change24h: "N/A" };
  }
  const price = data.market_data.current_price.usd.toFixed(2);
  const change24h = data.market_data.price_change_percentage_24h?.toFixed(2) || "N/A";
  console.log(`Fetched current price: $${price}, 24h change: ${change24h}%`);
  return { price, change24h };
}

async function fetchHistoricalData(coinId: string): Promise<HistoricalData> {
  console.log(`Fetching historical data for ${coinId}`);
  const response = await fetchWithApiKey(COINGECKO_HISTORICAL_URL(coinId));
  if (!response.ok) {
    console.error(`Failed to fetch historical data for ${coinId}: ${response.status}`);
    return { prices: [], summary: "Failed to fetch historical data." };
  }
  const historicalData = await response.json();
  const prices = historicalData.prices || [];
  if (prices.length < 2) {
    console.error(`Insufficient historical data for ${coinId}`);
    return { prices, summary: "Insufficient historical data available." };
  }
  const oldestPrice = prices[0]?.[1] || 0;
  const currentPrice = prices[prices.length - 1]?.[1] || 0;
  const priceChange =
    currentPrice && oldestPrice
      ? (((currentPrice - oldestPrice) / oldestPrice) * 100).toFixed(2)
      : "N/A";
  console.log(`Historical prices length: ${prices.length}, 90-day change: ${priceChange}%`);
  return {
    prices,
    summary: `Over the last 90 days, the price changed by ${priceChange}%.`,
  };
}

export async function POST(req: Request) {
  try {
    console.log("Starting POST request processing");
    const body = await req.json();
    console.log("Request body:", body);
    const {
      userId,
      message,
      chatHistory,
    }: { userId: string; message: string; chatHistory: ChatMessage[] } = body;

    if (!userId || !message) {
      console.log("Missing userId or message");
      return NextResponse.json(
        { error: "User ID and message are required" },
        { status: 400 }
      );
    }

    console.log(`Checking credits for user: ${userId}`);
    const hasCredits = await hasEnoughCredits(userId, 2);
    if (!hasCredits) {
      console.log(`Not enough credits for user: ${userId}`);
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      console.log("Missing GROK_API_KEY");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    console.log("Connecting to database");
    await connect();
    console.log("Fetching top coins from DB");
    const topCoins = await Crypto.find().sort({ market_cap: -1 }).limit(20);
    console.log(`Top coins fetched: ${topCoins.length}`);
    console.log("Fetching trending coins from DB");
    const trendingCoins = await Trending.find()
      .sort({ market_cap_rank: 1 })
      .limit(10);
    console.log(`Trending coins fetched: ${trendingCoins.length}`);

    const influencerMatches: string[] = message.match(/@([A-Za-z0-9_]+)/g) || [];
    console.log(`Influencer matches: ${influencerMatches}`);
    const tickerMatches: string[] = message.match(/\$([a-zA-Z0-9-]+)/g) || [];
    console.log(`Ticker matches: ${tickerMatches}`);
    const isGlobalQuery = /market.*(today|performing|news)/i.test(message);
    console.log(`Is global query: ${isGlobalQuery}`);

    const coinData: Record<string, CoinData> = {};

    // Process coin tickers
    for (const ticker of tickerMatches) {
      const coinInput = ticker.replace("$", "").toLowerCase();
      console.log(`Processing ticker: ${ticker}, coinInput: ${coinInput}`);

      console.log(`Checking DB for coin: ${coinInput}`);
      const coin: ICrypto | null = await Crypto.findOne({ id: coinInput });
      console.log(`DB coin result: ${coin ? JSON.stringify(coin) : "null"}`);

      const coinId = await fetchCoinIdByNameOrSymbol(coinInput) || coinInput;
      const cacheKey = `price_${coinId}`;
      const cached = cache[cacheKey];
      const isStale = !cached || Date.now() - cached.timestamp > CACHE_TTL;

      let current: CurrentPriceData;
      if (coin && !isStale) {
        console.log(`Using DB data for ${coinInput}`);
        current = {
          price: coin.current_price?.toFixed(2) || "N/A",
          change24h: coin.price_change_percentage_24h?.toFixed(2) || "N/A",
        };
      } else {
        console.log(`Fetching current data from CoinGecko for: ${coinId}`);
        current = await fetchCurrentData(coinId);
      }

      const historical = await fetchHistoricalData(coinId);
      const isTrending = trendingCoins.some((t) => t.id.toLowerCase() === coinInput);

      coinData[coinInput] = {
        current,
        historical,
        isTrending: isTrending ? true : undefined,
      };

      if (isStale || !cached) {
        cache[cacheKey] = {
          data: coinData[coinInput],
          timestamp: Date.now(),
        };
      }
    }
    console.log(`Coin data processed: ${JSON.stringify(coinData)}`);

    const systemPrompt = `
You are Grok, a crypto market expert AI with access to all data, including X posts. Respond in 2 paragraphs, max 15 sentences total, with only the most critical insights for the user’s query. Exclude unnecessary explanations or raw data unless explicitly requested:

**Instructions:**
- For tickers with $ (e.g., $render), use coinData (current price, 24h change, 90-day summary) for analysis. Base responses solely on this data.
- If historical data fails, say "No 90-day data available" and use current data.
- For "N/A" prices, say "No data for [coin]."
- Note trending status only if coinData.isTrending is true, e.g., "$[coin] is trending."
- When asked for MACD, RSI, or SMA, calculate from historical.prices (timestamp, price) using MACD (12, 26, 9), RSI (14), SMA (20). Provide latest values and a concise long/short signal, no formulas or data tables.
- For @username, search their X posts (last 4 weeks) for query-related insights, report key findings only.
- For market queries (e.g., "market news"), search X posts (last 7 days) from ${influencers.join(
      ", "
    )} for crypto insights, summarize briefly.

**Top 20 Coins:**
${topCoins
  .map(
    (c) =>
      `${c.name} (${c.symbol.toUpperCase()}): $${
        c.current_price?.toFixed(2) || "N/A"
      } (${c.price_change_percentage_24h?.toFixed(2) || "N/A"}% 24h)`
  )
  .join("\n")}

**Trending Coins (for market queries):**
${trendingCoins
  .map(
    (c) =>
      `${c.name} (${c.symbol.toUpperCase()}): $${
        c.market_data.price?.toFixed(2) || "N/A"
      }`
  )
  .join("\n")}

**Specific Coin Data:**
${
  Object.entries(coinData)
    .map(
      ([symbol, data]) =>
        `${symbol}: Current $${data.current.price} (${
          data.current.change24h
        }% 24h), ${
          data.historical.summary
        }\nPrices (timestamp, price): ${JSON.stringify(
          data.historical.prices
        )}${data.isTrending ? " - Trending!" : ""}`
    )
    .join("\n") || "No coin data available."
}

**Influencer List for Market Queries:**
${influencers.join(", ")}

**Timestamp:** ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.
`;
    console.log("System prompt prepared");

    console.log("Initializing OpenAI client");
    const client = new OpenAI({
      apiKey: GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
    console.log("Sending request to OpenAI");
    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-5),
        { role: "user", content: message },
      ],
      max_tokens: 200, // Reduced from 400 to enforce brevity
      temperature: 0.2, // Lowered from 0.3 for more focused, less creative output
    });
    console.log("OpenAI response received");

    const responseText =
      completion.choices[0]?.message?.content || "⚠️ No response generated.";
    console.log(`Response text: ${responseText}`);

    console.log(`Deducting credits for user: ${userId}`);
    await deductCredits(userId, 2);

    console.log("Returning response");
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("❌ Error generating response:", error);
    if (error instanceof Error && error.message.toLowerCase().includes("credits")) {
      console.log("Credit error detected");
      return NextResponse.json({ error: "Not enough credits" }, { status: 403 });
    }
    console.log("General error");
    return NextResponse.json({ error: "Chatbot failed to respond" }, { status: 500 });
  }
}