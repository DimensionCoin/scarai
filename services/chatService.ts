import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { NextResponse } from "next/server";
import { useValidation } from "@/hooks/chat/useValidation";
import { usePromptParser } from "@/hooks/chat/usePromptParser";
import { useUnifiedCoinData } from "@/hooks/chat/useUnifiedCoinData";
import { useTrendingCoins } from "@/hooks/chat/useTrendingCoins";
import { useMarketSnapshot } from "@/hooks/chat/useMarketSnapshot";
import { useSystemPrompt } from "@/hooks/chat/useSystemPrompt";
import { useTopCryptoData } from "@/hooks/chat/useTopCryptoData";
import { matchCategoryFromQuery } from "@/utils/matchCategory";
import { deductCredits, logCreditUsage } from "@/actions/user.actions";

// Utility: fetch coins in a specific category
async function fetchCategoryCoins(categoryId: string, count: number = 10) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=${count}&page=1&sparkline=false`,
    {
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY!,
      },
    }
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function processChatRequestStream({
  userId,
  message,
  chatHistory,
}: {
  userId: string;
  message: string;
  chatHistory: ChatMessage[];
}) {
  const validationError = await useValidation(userId, message);
  if (validationError) {
    return NextResponse.json({ error: validationError.error }, { status: 403 });
  }

  const parsedPrompt = await usePromptParser(message, chatHistory);
  const { coins, count = 10 } = parsedPrompt.entities;
  const coinId = coins?.[0];

  const matchedCategory =
    parsedPrompt.intent === "category_coins"
      ? matchCategoryFromQuery(parsedPrompt.entities.category || message)
      : null;

  const categoryCoinsPromise = matchedCategory
    ? fetchCategoryCoins(matchedCategory.category_id, count)
    : Promise.resolve([]);

  const [coinData, trendingCoins, marketSnapshot, topCoins, categoryCoins] =
    await Promise.all([
      useUnifiedCoinData(coins),
      useTrendingCoins(),
      ["market_trends", "trading_advice", "investment_strategy"].includes(
        parsedPrompt.intent
      )
        ? useMarketSnapshot()
        : Promise.resolve(null),
      useTopCryptoData(),
      categoryCoinsPromise,
    ]);

  const selectedCoin = coinId ? coinData[coinId] : null;

  const cleanCoinData = selectedCoin
    ? [
        {
          name: coinId,
          price: selectedCoin.current?.price ?? null,
          rsi: selectedCoin.historical?.technicals?.rsi ?? null,
          macd: selectedCoin.historical?.technicals?.macd?.macd ?? null,
          macdHist:
            selectedCoin.historical?.technicals?.macd?.histogram ?? null,
          sma20: selectedCoin.historical?.technicals?.sma?.sma20 ?? null,
          volume: selectedCoin.current?.volume ?? null,
          change24h: selectedCoin.current?.change24h ?? null,
          change7d: selectedCoin.marketTrends?.change7d ?? null,
          change30d: selectedCoin.marketTrends?.change30d ?? null,
          rangeSummary: selectedCoin.historical?.summary ?? null,
          volatility: selectedCoin.historical?.extended?.volatility ?? null,
          avgVolume: selectedCoin.historical?.extended?.avgVolume ?? null,
        },
      ]
    : [];

  const systemPrompt = useSystemPrompt(
    trendingCoins,
    coinData,
    marketSnapshot,
    parsedPrompt.intent === "category_coins" ? categoryCoins : topCoins,
    matchedCategory,
    parsedPrompt.entities.count ?? 10,
    cleanCoinData
  );

  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const stream = await client.chat.completions.create({
    model: "grok-2-latest",
    stream: true,
    temperature: 0.2,
    max_tokens: 800,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-5),
      {
        role: "user",
        content: `Original: "${message}"\nParsed: ${JSON.stringify(
          parsedPrompt
        )}`,
      },
    ],
  });

  // Start credit deduction early
  deductCredits(userId, 2).catch(() => null);
  logCreditUsage({
    userId,
    type: "oracle",
    message,
    creditsUsed: 2,
  }).catch(() => null);

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content;
        if (token) {
          controller.enqueue(encoder.encode(token));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
