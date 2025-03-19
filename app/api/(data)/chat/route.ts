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

    const tickerMatches = message.match(/\$([a-zA-Z0-9-]+)/g) || [];
    const influencerMatches: string[] =
      message.match(/@([A-Za-z0-9_]+)/g) || [];
    const isGlobalQuery = /market.*(today|performing|news)/i.test(message);

    const coinData: Record<string, CoinData> = {};
    for (const ticker of tickerMatches) {
      const coinId = ticker.replace("$", "").toLowerCase();
      const currentData = await fetchCoinData(coinId, null);
      const historical = await fetchHistoricalData(coinId);
      const indicators = calculateIndicators(historical.prices);
      coinData[coinId] = {
        ...currentData,
        historical: { ...historical, technicals: indicators },
        isTrending: trendingCoins.some((t) => t.id.toLowerCase() === coinId),
      };
    }

    const globalNews: GlobalNews = isGlobalQuery
      ? fetchGlobalNews("crypto market")
      : {};

    const systemPrompt = `
You are Grok, a crypto expert AI built by xAI. Respond concisely in 1-2 short paragraphs, max 10 sentences total, focusing on the user's intent:

**Instructions:**
- For general investment questions (e.g., "best coin to start with"), recommend a coin with a brief reason (e.g., "Bitcoin for its stability and recognition")—no detailed metrics unless requested.
- For $tickers, use coinData to provide price, 24h change, a one-line description (first sentence of description), and market cap rank. Add 90-day summary if performance is asked (e.g., "how’s $sui doing"), and technicals (MACD, RSI, SMA) with signals (e.g., RSI > 70 overbought) only if technical analysis is explicitly requested.
- If no 90-day data, say "No historical data" and use current data.
- For "N/A" prices, say "No data for [coin]."
- Note trending if coinData.isTrending is true: "$[coin] is trending."
- For @username from ${
      influencerMatches.length ? influencerMatches.join(", ") : "none mentioned"
    }, search their X posts (last 4 weeks) for insights, report 1-2 key findings.
- For market queries, use ${
      globalNews.xInstructions ?? "no global data"
    } and summarize in 1-2 sentences.
- Only include full coin details (description, categories, sentiment, ATH/ATL, trends) if the user asks for a deep dive (e.g., "tell me everything about $bitcoin").
- Keep responses short, factual, and avoid speculation.

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

**Timestamp:** ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.
`;

    {/*console.log("=== Data Sent to AI ===");
    console.log("User Message:", message);
    console.log("Coin Data:", JSON.stringify(coinData, null, 2));
    console.log("System Prompt:", systemPrompt);
    console.log("Chat History (last 5):", chatHistory.slice(-5));
  console.log("======================");*/}

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
