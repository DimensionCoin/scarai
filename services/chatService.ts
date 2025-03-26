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
import { ChatIntent } from "@/types/ChatIntent";
import { getRetestStructure } from "@/utils/trading/entryZones";

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

  const retestStructure =
    selectedCoin?.historical?.prices && selectedCoin?.historical?.volumes
      ? getRetestStructure(
          selectedCoin.historical.prices,
          selectedCoin.historical.volumes
        )
      : null;

  // Inside processChatRequestStream...

  const cleanCoinData = selectedCoin
    ? [
        {
          name: coinId,
          price: selectedCoin.current?.price ?? "N/A",
          volume: selectedCoin.current?.volume ?? "N/A",
          change24h: selectedCoin.current?.change24h ?? "N/A",
          change7d: selectedCoin.marketTrends?.change7d ?? "N/A",
          change30d: selectedCoin.marketTrends?.change30d ?? "N/A",
          rangeSummary: selectedCoin.historical?.summary ?? "N/A",

          // ✅ Flattened Daily Indicators
          daily: {
            rsi: selectedCoin.historical?.technical?.daily?.rsi ?? null,
            stochRsi:
              selectedCoin.historical?.technical?.daily?.stochRsi ?? null,
            stochRsiFlip:
              selectedCoin.historical?.technical?.daily?.stochRsiFlip ?? null,
            macd: selectedCoin.historical?.technical?.daily?.macd?.macd ?? null,
            macdSignal:
              selectedCoin.historical?.technical?.daily?.macd?.signal ?? null,
            macdHist:
              selectedCoin.historical?.technical?.daily?.macd?.histogram ??
              null,
            macdCrossover:
              selectedCoin.historical?.technical?.daily?.macd?.crossover ??
              null,
            macdRising:
              selectedCoin.historical?.technical?.daily?.macd?.isRising ?? null,
            sma20:
              selectedCoin.historical?.technical?.daily?.sma?.sma20 ?? null,
            smaAbove:
              selectedCoin.historical?.technical?.daily?.sma?.aboveSma ?? null,
            volumeSupport:
              selectedCoin.historical?.technical?.daily?.volumeSupport ?? null,
            confidence:
              selectedCoin.historical?.technical?.daily?.confidence ?? null,
          },

          // ✅ Flattened 4H Indicators
          fourHour: {
            rsi: selectedCoin.historical?.technical?.fourHour?.rsi ?? null,
            stochRsi:
              selectedCoin.historical?.technical?.fourHour?.stochRsi ?? null,
            stochRsiFlip:
              selectedCoin.historical?.technical?.fourHour?.stochRsiFlip ??
              null,
            macd:
              selectedCoin.historical?.technical?.fourHour?.macd?.macd ?? null,
            macdSignal:
              selectedCoin.historical?.technical?.fourHour?.macd?.signal ??
              null,
            macdHist:
              selectedCoin.historical?.technical?.fourHour?.macd?.histogram ??
              null,
            macdCrossover:
              selectedCoin.historical?.technical?.fourHour?.macd?.crossover ??
              null,
            macdRising:
              selectedCoin.historical?.technical?.fourHour?.macd?.isRising ??
              null,
            sma20:
              selectedCoin.historical?.technical?.fourHour?.sma?.sma20 ?? null,
            smaAbove:
              selectedCoin.historical?.technical?.fourHour?.sma?.aboveSma ??
              null,
            volumeSupport:
              selectedCoin.historical?.technical?.fourHour?.volumeSupport ??
              null,
            confidence:
              selectedCoin.historical?.technical?.fourHour?.confidence ?? null,
          },

          volatility: selectedCoin.historical?.extended?.volatility ?? null,
          avgVolume: selectedCoin.historical?.extended?.avgVolume ?? null,

          priceHistory: selectedCoin.historical?.prices?.slice(-12) ?? [],
          volumes: selectedCoin.historical?.volumes?.slice(-12) ?? [],

          supportLevels:
            selectedCoin.historical?.supportResistance?.supportLevels ?? [],
          resistanceLevels:
            selectedCoin.historical?.supportResistance?.resistanceLevels ?? [],

          // 🧠 Retest + Trading Intelligence
          retestStructure,
          recentBreakoutStrength:
            retestStructure?.recentBreakoutStrength ?? null,
          priceCompression: retestStructure?.priceCompression ?? null,
          priceAcceleration: retestStructure?.priceAcceleration ?? null,
          supportDistance: retestStructure?.supportDistance ?? null,
          breakoutVolatility: retestStructure?.breakoutVolatility ?? null,
          breakoutAge: retestStructure?.breakoutAge ?? null,
          falseBreakout: retestStructure?.falseBreakout ?? null,
          recentRejection: retestStructure?.recentRejection ?? null,
          supportStrength: retestStructure?.supportStrength ?? null,
        },
      ]
    : [];

  console.log(
    "📊 Price History Sample:",
    cleanCoinData?.[0]?.priceHistory?.slice(-3)
  );
  console.log("📦 Volumes Sample:", cleanCoinData?.[0]?.volumes?.slice(-3));

  const systemPrompt = useSystemPrompt(
    trendingCoins,
    coinData,
    marketSnapshot,
    parsedPrompt.intent === "category_coins" ? categoryCoins : topCoins,
    matchedCategory,
    parsedPrompt.entities.count ?? 10,
    cleanCoinData,
    parsedPrompt.intent as ChatIntent
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

  console.log("🧠 System Prompt Sent to Grok:\n", systemPrompt);
  console.log(parsedPrompt);

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
