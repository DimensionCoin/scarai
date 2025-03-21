import OpenAI from "openai";
import { deductCredits } from "@/actions/user.actions";
import { useValidation } from "@/hooks/chat/useValidation";
import { useTrendingCoins } from "@/hooks/chat/useTrendingCoins";
import { useUnifiedCoinData } from "@/hooks/chat/useUnifiedCoinData";
import { usePromptParser } from "@/hooks/chat/usePromptParser";
import { useSystemPrompt } from "@/hooks/chat/useSystemPrompt";
import { ChatMessage } from "@/types/chat";

export async function processChatRequest({
  userId,
  message,
  chatHistory,
}: {
  userId: string;
  message: string;
  chatHistory: ChatMessage[];
}) {
  // Step 1: Validate user and message
  const validationError = await useValidation(userId, message);
  if (validationError) return validationError;

  // Step 2: Parse prompt (intent + entities)
  const parsedPrompt = await usePromptParser(message, chatHistory);
  console.log("Parsed Prompt:", parsedPrompt);

  const { coins } = parsedPrompt.entities;

  // Step 3: Fetch unified coin data (real-time + historical + indicators)
  const allCoinData = await useUnifiedCoinData(coins);

  // Step 4: Get trending coins for context
  const trendingCoins = await useTrendingCoins();

  // Step 5: Build the full system prompt
  const systemPrompt = useSystemPrompt(trendingCoins, allCoinData);

  // Step 6: Generate assistant response from Grok
  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...chatHistory.slice(-5),
      {
        role: "user",
        content: `Original: "${message}"\nParsed: ${JSON.stringify(
          parsedPrompt
        )}\nCoin Data: ${JSON.stringify(allCoinData)}`,
      },
    ],
    max_tokens: 350,
    temperature: 0.2,
  });

  const response =
    completion.choices[0]?.message?.content || "No response generated";

  // Step 7: Deduct user credits
  await deductCredits(userId, 2);

  return response;
}
