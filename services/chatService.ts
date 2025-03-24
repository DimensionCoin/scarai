import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { deductCredits, logCreditUsage } from "@/actions/user.actions";

import { useValidation } from "@/hooks/chat/useValidation";
import { usePromptParser } from "@/hooks/chat/usePromptParser";
import { useUnifiedCoinData } from "@/hooks/chat/useUnifiedCoinData";
import { useTrendingCoins } from "@/hooks/chat/useTrendingCoins";
import { useMarketSnapshot } from "@/hooks/chat/useMarketSnapshot";
import { useSystemPrompt } from "@/hooks/chat/useSystemPrompt";
import { useTopCryptoData } from "@/hooks/chat/useTopCryptoData";
import { matchCategoryFromQuery } from "@/utils/matchCategory";

// ✅ Utility to fetch category coins dynamically
async function fetchCategoryCoins(categoryId: string, count: number = 10) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=${count}&page=1&sparkline=false`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY!,
    },
  });

  if (!res.ok) return [];
  return await res.json();
}

export async function processChatRequest({
  userId,
  message,
  chatHistory,
}: {
  userId: string;
  message: string;
  chatHistory: ChatMessage[];
}) {
  // ✅ Step 1: Validate
  const validationError = await useValidation(userId, message);
  if (validationError) return validationError;

  // ✅ Step 2: Parse Prompt
  const parsedPrompt = await usePromptParser(message, chatHistory);
  const { coins, count = 10 } = parsedPrompt.entities;
  const coinId = coins?.[0];
    console.log(parsedPrompt)
  // ✅ Step 3: Category Matching (if applicable)
  const matchedCategory =
    parsedPrompt.intent === "category_coins"
      ? matchCategoryFromQuery(parsedPrompt.entities.category || message)
      : null;

  const categoryCoins = matchedCategory
    ? await fetchCategoryCoins(matchedCategory.category_id, count)
    : [];

  // ✅ Step 4: Fetch Data
  const [coinData, trendingCoins, marketSnapshot, topCoins] = await Promise.all(
    [
      useUnifiedCoinData(coins),
      useTrendingCoins(),
      ["market_trends", "trading_advice", "investment_strategy"].includes(
        parsedPrompt.intent
      )
        ? useMarketSnapshot()
        : Promise.resolve(null),
      useTopCryptoData(),
    ]
  );

  // ✅ Step 4.5: Extract single coin snapshot (for trading_advice, coin_data, etc.)
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


  console.log("📉 Macro Data:", JSON.stringify(marketSnapshot, null, 2));
  console.log("📊 Market Snapshot Sent to Grok:", marketSnapshot);
  console.log("🪙 Top Coins Sent to Grok:", topCoins?.slice(0, 2));
  console.log("🗂️ Category Match:", matchedCategory?.name ?? "None");
  console.log("📦 Category Coins:", categoryCoins?.slice(0, 2));

  // ✅ Step 5: Build System Prompt
  const systemPrompt = useSystemPrompt(
    trendingCoins,
    coinData,
    marketSnapshot,
    parsedPrompt.intent === "category_coins" ? categoryCoins : topCoins,
    matchedCategory,
    parsedPrompt.entities.count ?? 10,
    cleanCoinData
  );

  // ✅ Step 6: Call Grok
  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
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
    max_tokens: 800,
    temperature: 0.2,
  });

  const response =
    completion.choices[0]?.message?.content || "No response generated";

  // ✅ Step 7: Deduct credits and log usage
  await deductCredits(userId, 2);
  await logCreditUsage({
    userId,
    type: "oracle",
    message,
    creditsUsed: 2,
  });

  return response;
}
