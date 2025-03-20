import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connect } from "@/db";
import Trending from "@/models/trending.model";
import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";
import { fetchCoinData } from "@/hooks/chat/fetchCoinData";
import { fetchHistoricalData } from "@/hooks/chat/fetchHistoricalData";
import { calculateIndicators } from "@/hooks/chat/calculateIndicators";
import { fetchGlobalNews, GlobalNews } from "@/hooks/chat/fetchGlobalNews";

// Define the enriched CoinData interface (unchanged)
interface CoinData {
  current: {
    price: string;
    change24h: string;
    volume: string;
    marketCap: string;
  };
  description: string;
  categories: string[];
  genesisDate: string | null;
  sentiment: {
    upPercentage: number;
    downPercentage: number;
  };
  links: {
    homepage: string[];
    blockchainSites: string[];
    twitter: string;
    telegram: string;
    reddit: string;
    github: string[];
  };
  marketTrends: {
    ath: string;
    athDate: string;
    atl: string;
    atlDate: string;
    change7d: string;
    change14d: string;
    change30d: string;
  };
  marketCapRank: number;
  tickers: Array<{
    base: string;
    target: string;
    marketName: string;
    lastPrice: number;
    volume: number;
    convertedLastUsd: number;
  }>;
  historical?: {
    prices: number[][];
    summary: string;
    technicals: {
      rsi: number | null;
      macd: { macd: number; signal: number; histogram: number } | null;
      sma: { sma20: number } | null;
    };
  };
  isTrending?: boolean;
}

const INFLUENCERS = [
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, message, chatHistory } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!(await hasEnoughCredits(userId, 2))) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 403 }
      );
    }

    await connect();
    const trendingCoins = await Trending.find()
      .sort({ market_cap_rank: 1 })
      .limit(10);

    const tickerMatches = message.match(/\/([a-zA-Z0-9-]+)/g) || [];
    const influencerMatches: string[] =
      message.match(/@([A-Za-z0-9_]+)/g) || [];
    const isGlobalQuery = /market.*(today|performing|news)/i.test(message);

    const coinData: Record<string, CoinData> = {};
    for (const ticker of tickerMatches) {
      const coinId = ticker.replace("/", "").toLowerCase();
      const currentData = await fetchCoinData(coinId, null);
      const historical = await fetchHistoricalData(coinId);
      const indicators = calculateIndicators(historical.prices);
      coinData[coinId] = {
        ...currentData,
        historical: { ...historical, technicals: indicators },
        isTrending: trendingCoins.some((t) => t.id.toLowerCase() === coinId),
      };
    }

    // Fetch global news instructions if it's a market query
    const globalNews: GlobalNews = isGlobalQuery
      ? await fetchGlobalNews("crypto market")
      : {};

    const systemPrompt = `
You are Grok, a crypto quant trading assistant built by xAI, designed to crunch numbers and provide research for traders from beginner to expert. Respond concisely in 1-2 paragraphs, max 10 sentences total, focusing on the user's intent:

**Instructions:**
- For general questions (e.g., "best coin to start with"), suggest a coin with a data-driven reason (e.g., "Bitcoin: highest market cap, stable for beginners").
- For /tickers, provide price, 24h change, a one-line description (first sentence of description), and market cap rank. Add 90-day summary if performance is asked (e.g., "how’s /sui doing").
- For timeframe-specific requests (e.g., "2-hour indicators for /solana"), use historical.prices (90-day daily data) if available. If the requested timeframe (e.g., 2h) isn’t supported, say "I only have daily data for /coin; here’s the daily analysis. Provide 2-hour prices if you want me to crunch those." Then give daily support/resistance (recent highs/lows from historical.prices), MACD, RSI, SMA20, and long/short advice.
- If users provide prices (e.g., "here’s 2h data: $130, $132..."), calculate indicators and give precise trading advice (entry, stop-loss, take-profit) based on that data.
- If no historical data, say "No historical data" and use current data. For "N/A" prices, say "No data for [coin]."
- Note trending if coinData.isTrending is true: "/[coin] is trending."
- For @username from ${
      influencerMatches.length ? influencerMatches.join(", ") : "none mentioned"
    }, search their X posts (last 4 weeks) for insights, report 1-2 findings.
- For market queries (e.g., "global news" or "market today"), use ${
      globalNews.xInstructions || "no global instructions"
    } plus key influencers (${INFLUENCERS.join(", ")}) and any mentioned (${
      influencerMatches.length ? influencerMatches.join(", ") : "none"
    }) to summarize X sentiment in 1-2 sentences (e.g., "Market up, @elonmusk bullish on BTC").
- For allocation questions (e.g., "split $100 between /solana and /ethereum"), analyze coinData (price, 24h change, 90-day trend, trending status), favor momentum (24h change > 5% or trending) for short-term, stability (market cap rank < 10) for long-term, and explain split.
- Act as a quant: focus on data-driven trading advice, research, and number-crunching to save traders time.

**Trending Coins:**
${trendingCoins
  .map(
    (c) =>
      `${c.name} (${c.symbol.toUpperCase()}): $${
        c.market_data?.price?.toFixed(2) || "N/A"
      }`
  )
  .join("\n")}

**Coin Data:**
${
  Object.entries(coinData)
    .map(([symbol, data]) => {
      return `${symbol}: $${data.current.price} (${
        data.current.change24h
      }% 24h), ${data.historical?.summary || "No historical data"}, MACD ${
        data.historical?.technicals.macd?.macd.toFixed(2) || "N/A"
      } (Signal ${
        data.historical?.technicals.macd?.signal.toFixed(2) || "N/A"
      }), RSI ${data.historical?.technicals.rsi?.toFixed(2) || "N/A"}, SMA20 $${
        data.historical?.technicals.sma?.sma20.toFixed(2) || "N/A"
      } - Description: ${data.description.slice(
        0,
        100
      )}..., Categories: ${data.categories
        .slice(0, 3)
        .join(", ")}, Sentiment: ${data.sentiment.upPercentage}% up/${
        data.sentiment.downPercentage
      }% down, Rank: #${data.marketCapRank}, ATH: $${data.marketTrends.ath} (${
        data.marketTrends.athDate
      }), ATL: $${data.marketTrends.atl} (${
        data.marketTrends.atlDate
      }), Trends: 7d ${data.marketTrends.change7d}%, 14d ${
        data.marketTrends.change14d
      }%, 30d ${data.marketTrends.change30d}%${
        data.isTrending ? " - Trending!" : ""
      }`;
    })
    .join("\n") || "No coin data."
}

**Global News Instructions:**
${globalNews.xInstructions || "No global news instructions available."}

**Timestamp:** ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.
`;

    const client = new OpenAI({
      apiKey: process.env.GROK_API_KEY!,
      baseURL: "https://api.x.ai/v1",
    });
    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-5),
        { role: "user", content: message },
      ],
      max_tokens: 320,
      temperature: 0.4,
    });

    await deductCredits(userId, 2);
    return NextResponse.json({
      response:
        completion.choices[0]?.message?.content || "No response generated",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
