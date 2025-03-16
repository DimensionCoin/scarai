import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connect } from "@/db";
import Crypto from "@/models/crypto.model";
import Trending from "@/models/trending.model";

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
interface CoinData {
  name: string;
  symbol: string;
  price: string;
  change24h: string;
}

interface CacheEntry {
  data: CoinData | CurrentPriceData | HistoricalData;
  timestamp: number;
}

interface CurrentPriceData {
  price: string;
  change24h: string;
}

interface HistoricalData {
  summary: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// In-memory cache
const cache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24-hour cache expiration

// Fetch top 20 coins from database
async function fetchTop20CryptoPrices(): Promise<CoinData[]> {
  try {
    await connect();
    const cryptos = await Crypto.find().sort({ market_cap: -1 }).limit(20);
    return cryptos.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price?.toFixed(2) ?? "N/A",
      change24h: coin.price_change_percentage_24h?.toFixed(2) ?? "N/A",
    }));
  } catch (error) {
    console.error("❌ Error fetching top 20 from DB:", error);
    return [];
  }
}

// Fetch trending coins from database
async function fetchTrendingCoins(): Promise<CoinData[]> {
  try {
    await connect();
    const trending = await Trending.find()
      .sort({ market_cap_rank: 1 })
      .limit(10);
    return trending.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price?.toFixed(2) ?? "N/A",
      change24h: "N/A",
    }));
  } catch (error) {
    console.error("❌ Error fetching trending coins:", error);
    return [];
  }
}

// Fetch CoinGecko ID for a ticker
async function fetchCoinId(symbol: string): Promise<string | null> {
  try {
    await connect();
    const coin =
      (await Crypto.findOne({ symbol: symbol.toLowerCase() })) ||
      (await Trending.findOne({ symbol: symbol.toLowerCase() }));
    if (coin) return coin.id;

    const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
    if (!response.ok) throw new Error("Failed to fetch coin list");
    const coins = await response.json();
    const matchedCoin = coins.find(
      (c: { id: string; symbol: string }) =>
        c.symbol.toLowerCase() === symbol.toLowerCase()
    );
    return matchedCoin ? matchedCoin.id : null;
  } catch (error) {
    console.error(`❌ Error fetching CoinGecko ID for ${symbol}:`, error);
    return null;
  }
}

// Fetch current price from CoinGecko
async function fetchCurrentPrice(coinId: string): Promise<CurrentPriceData> {
  const cacheKey = `price_${coinId}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data as CurrentPriceData;
  }

  try {
    const response = await fetch(COINGECKO_CURRENT_PRICE_URL(coinId));
    if (!response.ok) throw new Error("Failed to fetch current price");
    const data = await response.json();
    const result = data[0]
      ? {
          price: data[0].current_price.toFixed(2),
          change24h: data[0].price_change_percentage_24h.toFixed(2),
        }
      : { price: "N/A", change24h: "N/A" };
    cache[cacheKey] = { data: result, timestamp: now };
    return result;
  } catch (error) {
    console.error(`❌ Error fetching price for ${coinId}:`, error);
    return { price: "N/A", change24h: "N/A" };
  }
}

// Fetch historical data from CoinGecko
async function fetchHistoricalData(
  coinId: string,
  symbol: string
): Promise<HistoricalData> {
  const cacheKey = `historical_${coinId}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data as HistoricalData;
  }

  try {
    const response = await fetch(COINGECKO_HISTORICAL_URL(coinId));
    if (!response.ok) throw new Error("Failed to fetch historical data");
    const data = await response.json();
    const firstPrice = data.prices[0][1];
    const lastPrice = data.prices[data.prices.length - 1][1];
    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const result = {
      summary: `${symbol}: Started at $${firstPrice.toFixed(
        2
      )} → now $${lastPrice.toFixed(2)}, ${percentageChange.toFixed(2)}% (90d)`,
    };
    cache[cacheKey] = { data: result, timestamp: now };
    return result;
  } catch (error) {
    console.error(`❌ Error fetching historical data for ${coinId}:`, error);
    return { summary: "⚠️ Unable to fetch historical data." };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      chatHistory,
    }: { message: string; chatHistory: ChatMessage[] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Fetch base data
    const topCoins = await fetchTop20CryptoPrices();
    const trendingCoins = await fetchTrendingCoins();

    // Detect @username, $TICKER, and global market news
    const influencerMatches: string[] =
      message.match(/@([A-Za-z0-9_]+)/g) || [];
    const tickerMatches: string[] = message.match(/\$([A-Z]{2,6})\b/g) || [];
    const isGlobalQuery: boolean = message
      .toLowerCase()
      .includes("global market news");

    // Process specific coin data
    const coinData: {
      [key: string]: { current: CurrentPriceData; historical: HistoricalData };
    } = {};
    for (const ticker of tickerMatches) {
      const symbol = ticker.replace("$", "").toUpperCase();
      const coinId = await fetchCoinId(symbol.toLowerCase());
      if (coinId) {
        const current = await fetchCurrentPrice(coinId);
        const historical = await fetchHistoricalData(coinId, symbol);
        coinData[symbol] = { current, historical };
      }
    }

    // Process influencer data
    let influencerPrompt = "";
    if (influencerMatches.length > 0) {
      const usernames: string[] = influencerMatches.map((m: string) =>
        m.replace("@", "")
      );
      influencerPrompt = `Analyze recent X posts (past 48h) from ${usernames
        .map((u: string) => `@${u}`)
        .join(
          ", "
        )} for insights on crypto, stocks, markets, or personal finance. Summarize findings without quoting tweets.`;
    }

    // Process global market news from all influencers
    let globalMarketPrompt = "";
    if (isGlobalQuery) {
      globalMarketPrompt = `Search X posts from the past 48 hours from these influencers: ${influencers.join(
        ", "
      )} for insights on global market news related to crypto, stocks, or finance. Summarize key trends in 2-3 sentences without quoting tweets.`;
    }

    // Format data for prompt
    const topCoinsStr = topCoins
      .map((c) => `${c.name} (${c.symbol}): $${c.price} (${c.change24h}% 24h)`)
      .join("\n");
    const trendingCoinsStr = trendingCoins
      .map((c) => `${c.name} (${c.symbol}): $${c.price}`)
      .join("\n");
    const coinDataStr = Object.entries(coinData)
      .map(
        ([symbol, data]) =>
          `${symbol}: Current $${data.current.price} (${data.current.change24h}% 24h), ${data.historical.summary}`
      )
      .join("\n");

    // Updated system prompt
    const systemPrompt = `
You are Grok, a financial advisor AI built by xAI for a crypto platform, specializing in crypto analysis with general market awareness. Provide brief, data-driven answers (3-4 sentences max) using:

**Top 20 Coins:**
${topCoinsStr || "⚠️ No top coin data available."}

**Trending Coins:**
${trendingCoinsStr || "⚠️ No trending coin data available."}

**Specific Coin Data (from CoinGecko):**
${coinDataStr || "No specific coin data requested."}

**Influencer Insights:**
${influencerPrompt || "No specific influencer data requested."}

**Global Market News (if requested):**
${globalMarketPrompt || "No global market news requested."}

**Instructions:**
1. **Crypto Focus**: Center responses on crypto performance (e.g., $BTC, $ETH, $SOL) using provided data, keeping it short and precise.
2. **Detect @username**: If "@username" is in the message, analyze their recent X posts (past 48h) for crypto or finance insights and summarize.
3. **Detect $TICKER**: If "$TICKER" (e.g., $SOL) is in the message, use CoinGecko data for that coin.
4. **Global Market News**: If "global market news" is in the message, search all listed influencers’ X posts (past 48h) for market trends and summarize.
5. **Market Context**: Use web/X data to note stock market trends (e.g., S&P 500) or events (e.g., Fed rates) in one sentence—link to crypto impact only if relevant.
6. **Financial Advice**: For "saving," "investing," or "beginner" queries, give 1-2 crypto-focused tips (e.g., stablecoins, Coinbase); tie stocks to crypto briefly if asked.
7. **Stay Relevant**: Focus on crypto and finance; if off-topic, say: "I’m built for crypto—ask about coins or markets!"
8. **Timestamp**: Current date is ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.

Deliver concise, actionable crypto insights—use market trends as context, not filler.
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
      max_tokens: 200,
      temperature: 0.5,
    });

    const responseText: string =
      completion.choices[0]?.message?.content || "⚠️ No response generated.";
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("❌ Error generating response:", error);
    return NextResponse.json(
      { error: "Chatbot failed to respond" },
      { status: 500 }
    );
  }
}
