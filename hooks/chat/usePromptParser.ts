import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";

function extractEntities(message: string) {
  const coins = message.match(/\/[a-zA-Z0-9-]+/g) || [];
  const users = message.match(/@[a-zA-Z0-9_]+/g) || [];

  return {
    coins: [...new Set(coins.map((c) => c.toLowerCase()))],
    users: [...new Set(users.map((u) => u.toLowerCase()))],
  };
}

export async function usePromptParser(
  message: string,
  chatHistory: ChatMessage[] = []
) {
  const { coins, users } = extractEntities(message);
  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const lastMessages =
    chatHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n") || "No prior context";

  const systemPrompt = `
You are a prompt parser for a crypto trading assistant. Analyze the message and context, returning ONLY a valid JSON string with:
- intent: "coin_data" | "trading_advice" | "investment_advice" | "x_posts" | "compare" | "mixed" | "explain_concept" | "unknown"
- entities: { coins: ["/coin1", "/coin2"], users: ["@user1"] }
- context: A short sentence describing what the user wants.

**Rules:**
- "what is /coin", "explain /coin", "tell me about /coin" → intent: "explain_concept"
- "/[coin]" alone → intent: "coin_data"
- "@[user]" alone → intent: "x_posts"
- "should I buy /[coin]", "hold /[coin]" → intent: "investment_advice"
- "entry for /[coin]", "levels /[coin]" → intent: "trading_advice"
- "/coin1 vs /coin2" → intent: "compare"
- "/coin @user" → intent: "mixed"
- If unclear, use context from last message or return "unknown"

**Message:** "${message}"
**Last 2 Messages:** "${lastMessages}"
`;

  try {
    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 150,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\n/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return {
      intent: parsed.intent || "unknown",
      entities: { coins, users },
      context: parsed.context || "unclear",
    };
  } catch (error) {
    console.error("PromptParser Error:", error);
    return {
      intent: "unknown",
      entities: { coins, users },
      context: "Failed to parse—please clarify",
    };
  }
}
