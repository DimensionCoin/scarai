import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connect } from "@/db";
import Crypto from "@/models/crypto.model";
import Trending from "@/models/trending.model";
import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";
import { fetchCoinData } from "@/hooks/chat/fetchCoinData";
import { fetchHistoricalData } from "@/hooks/chat/fetchHistoricalData";
import { calculateIndicators } from "@/hooks/chat/calculateIndicators";
import { fetchGlobalNews, GlobalNews } from "@/hooks/chat/fetchGlobalNews";

// Define a specific type for coinData
interface CoinData {
  current: {
    price: string;
    change24h: string;
    volume: string;
    marketCap: string;
  };
  historical: {
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
    const topCoins = await Crypto.find().sort({ market_cap: -1 }).limit(20);
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
      const dbCoin = await Crypto.findOne({ id: coinId });
      const current = await fetchCoinData(coinId, dbCoin);
      const historical = await fetchHistoricalData(coinId);
      const indicators = calculateIndicators(historical.prices);
      coinData[coinId] = {
        ...current,
        historical: { ...historical, technicals: indicators },
        isTrending: trendingCoins.some((t) => t.id.toLowerCase() === coinId),
      };
    }

    const globalNews: GlobalNews = isGlobalQuery
      ? fetchGlobalNews("crypto market")
      : {};

    const systemPrompt = `
You are Grok, a crypto expert AI. Respond in 2 paragraphs, max 15 sentences total, with critical insights only:

**Instructions:**
- For $tickers, use coinData for price, 24h change, 90-day summary, and technicals (MACD, RSI, SMA). Report latest values and long/short signals.
- If no 90-day data, say "No historical data" and use current data.
- For "N/A" prices, say "No data for [coin]."
- Note trending if coinData.isTrending is true: "$[coin] is trending."
- For @username from ${
      influencerMatches.length ? influencerMatches.join(", ") : "none mentioned"
    }, search their X posts (last 4 weeks) for query insights, report key findings.
- For market queries, use ${globalNews.xInstructions ?? "no global data"}.

**Top Coins:**
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
        c.market_data.price?.toFixed(2) || "N/A"
      }`
  )
  .join("\n")}

**Coin Data:**
${
  Object.entries(coinData)
    .map(
      ([symbol, data]) =>
        `${symbol}: $${data.current.price} (${data.current.change24h}% 24h), ${
          data.historical.summary
        }, MACD ${data.historical.technicals.macd?.macd.toFixed(
          2
        )}, RSI ${data.historical.technicals.rsi?.toFixed(
          2
        )}, SMA20 $${data.historical.technicals.sma?.sma20.toFixed(2)}${
          data.isTrending ? " - Trending!" : ""
        }`
    )
    .join("\n") || "No coin data."
}

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
      max_tokens: 200,
      temperature: 0.2,
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
