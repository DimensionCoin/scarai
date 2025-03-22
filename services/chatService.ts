import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { deductCredits } from "@/actions/user.actions";

import { useValidation } from "@/hooks/chat/useValidation";
import { usePromptParser } from "@/hooks/chat/usePromptParser";
import { useUnifiedCoinData } from "@/hooks/chat/useUnifiedCoinData";
import { useTrendingCoins } from "@/hooks/chat/useTrendingCoins";
import { useMarketSnapshot } from "@/hooks/chat/useMarketSnapshot";
import { useSystemPrompt } from "@/hooks/chat/useSystemPrompt";
import { useTopCryptoData } from "@/hooks/chat/useTopCryptoData";

export async function processChatRequest({
  userId,
  message,
  chatHistory,
}: {
  userId: string;
  message: string;
  chatHistory: ChatMessage[];
}) {
  // ✅ Step 1: Validate user & input
  const validationError = await useValidation(userId, message);
  if (validationError) return validationError;

  // ✅ Step 2: Parse prompt
  const parsedPrompt = await usePromptParser(message, chatHistory);
  console.log("Parsed Prompt:", parsedPrompt);

  const { coins } = parsedPrompt.entities;

  // ✅ Step 3: Fetch data
  const [coinData, trendingCoins, marketSnapshot, topCoins] = await Promise.all(
    [
      useUnifiedCoinData(coins),
      useTrendingCoins(),
      parsedPrompt.intent === "market_trends"
        ? useMarketSnapshot()
        : Promise.resolve(null),
      useTopCryptoData(), 
    ]
  );

  console.log(
    "📊 Market Snapshot Sent to Grok:",
    JSON.stringify(marketSnapshot, null, 2)
  );

  // ✅ Step 4: Build system prompt
const systemPrompt = useSystemPrompt(
  trendingCoins,
  coinData,
  marketSnapshot,
  topCoins
);

  // ✅ Step 5: Generate assistant response
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
        )}\nCoin Data: ${JSON.stringify(coinData)}`,
      },
    ],
    max_tokens: 350,
    temperature: 0.2,
  });

  const response =
    completion.choices[0]?.message?.content || "No response generated";

  // ✅ Step 6: Deduct credits
  await deductCredits(userId, 2);

  return response;
}
