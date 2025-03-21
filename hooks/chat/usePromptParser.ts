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

function getLastUserMessage(chatHistory: ChatMessage[]) {
  return (
    [...chatHistory].reverse().find((m) => m.role === "user")?.content || ""
  );
}

export async function usePromptParser(
  message: string,
  chatHistory: ChatMessage[] = []
): Promise<{
  intent: string;
  entities: { coins: string[]; users: string[] };
  context: string;
}> {
  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const { coins, users } = extractEntities(message);
  const lastUserMsg = getLastUserMessage(chatHistory);
  const fullHistory =
    chatHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n") || "No prior context";

  // Pre-resolve vague follow-ups like "he did", "what about it"
  const isFollowUp = /^(he|she|they|it|that|what about|what is it|okay)$/i.test(
    message.trim()
  );

  if (
    isFollowUp &&
    (lastUserMsg.includes("/") || lastUserMsg.includes("@")) &&
    coins.length === 0 &&
    users.length === 0
  ) {
    const previousEntities = extractEntities(lastUserMsg);
    const fallbackIntent = previousEntities.users.length
      ? "x_posts"
      : previousEntities.coins.length
      ? "coin_data"
      : "unknown";

    return {
      intent: fallbackIntent,
      entities: {
        coins: [...new Set([...coins, ...previousEntities.coins])],
        users: [...new Set([...users, ...previousEntities.users])],
      },
      context: `Continuing conversation about ${
        previousEntities.coins[0] ||
        previousEntities.users[0] ||
        "unknown topic"
      }`,
    };
  }

  const systemPrompt = `
You are a crypto AI prompt parser. Given a user message and recent context, return ONLY a valid JSON string with:
- intent: one of: "coin_data", "trading_advice", "investment_advice", "x_posts", "compare", "mixed", "explain_concept", "unknown"
- entities: { coins: ["/coin1"], users: ["@user1"] }
- context: a short, clear summary of what the user wants

### Rules:
- "what is /coin", "tell me about /coin", "explain /coin" → intent: "explain_concept"
- "/coin" alone → intent: "coin_data"
- "should I buy /coin", "hold /coin", "good long term" → intent: "investment_advice"
- "entry", "levels", "target" with /coin → intent: "trading_advice"
- "@user" alone → intent: "x_posts"
- "/coin vs /coin2", "@user1 vs @user2" → intent: "compare"
- "/coin @user" → intent: "mixed"
- If vague or refers to a previous message (e.g. "he did", "what about it"), use recent context to resolve

### Input:
Message: "${message}"
Last messages:
${fullHistory}

Return ONLY this format:

{
  "intent": "...",
  "entities": { "coins": [...], "users": [...] },
  "context": "..."
}
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
      .replace(/```json|```/g, "")
      .replace(/\n/g, "")
      .trim();

    // Ensure valid JSON quotes
    if (!cleaned.startsWith("{")) {
      throw new Error("Invalid format returned by Grok");
    }

    const parsed = JSON.parse(cleaned);

    const parsedCoins =
      Array.isArray(parsed?.entities?.coins) &&
      (parsed.entities.coins as unknown[]).every(
        (v): v is string => typeof v === "string"
      )
        ? (parsed.entities.coins as string[]).map((c) => c.toLowerCase())
        : coins;

    const parsedUsers =
      Array.isArray(parsed?.entities?.users) &&
      (parsed.entities.users as unknown[]).every(
        (v): v is string => typeof v === "string"
      )
        ? (parsed.entities.users as string[]).map((u) => u.toLowerCase())
        : users;

    return {
      intent: typeof parsed.intent === "string" ? parsed.intent : "unknown",
      entities: {
        coins: [...new Set(parsedCoins)],
        users: [...new Set(parsedUsers)],
      },
      context:
        typeof parsed.context === "string" ? parsed.context : "unclear request",
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
