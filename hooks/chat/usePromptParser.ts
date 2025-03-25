import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { matchCategoryFromQuery } from "@/utils/matchCategory";
import { ChatIntent } from "@/types/ChatIntent";

const VALID_INTENTS: ChatIntent[] = [
  "coin_data",
  "trading_advice",
  "investment_strategy",
  "category_coins",
  "top_coin_data",
  "market_trends",
  "technical_analysis",
  "compare",
  "explain_concept",
  "x_posts",
  "mixed",
  "unknown",
];

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
  intent: ChatIntent;
  entities: {
    coins: string[];
    users: string[];
    category?: string;
    count?: number;
  };
  context: string;
}> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: "https://api.deepseek.com",
  });

  const { coins, users } = extractEntities(message);
  const lastUserMsg = getLastUserMessage(chatHistory);
  const fullHistory =
    chatHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n") || "No prior context";

  const amountMatch = message.match(/top\s+(\d{1,3})/i);
  const count = amountMatch ? parseInt(amountMatch[1], 10) : undefined;

  const categoryMatch = matchCategoryFromQuery(message);

  const systemPrompt = `
You are a crypto AI prompt parser. Given a user message and recent context, return ONLY a valid JSON string with:
- intent: one of ${VALID_INTENTS.map((i) => `"${i}"`).join(", ")}
- entities: { coins: ["/coin1"], users: ["@user1"], category?: "category_id", count?: number }
- context: a short, clear summary of what the user wants

### Examples:
- "how to read the RSI indicator?" → "technical_analysis"
- "entry & stop loss for /solana" → "trading_advice"
- "top 25 gaming coins" → "category_coins"
- "how's the market today?" → "market_trends"

Input Message:
"${message}"

Recent Context:
${fullHistory}

Return only valid JSON with no extra text.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 200,
      temperature: 0.1,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```(json)?/gi, "")
      .replace(/^.*?{/, "{")
      .replace(/\n/g, "")
      .trim();

    function coerceToValidJSON(input: string): string {
      return input
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/:\s*([^,"{}\[\]\s]+)/g, ': "$1"');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = JSON.parse(coerceToValidJSON(cleaned));
    }

    const parsedIntent = VALID_INTENTS.includes(parsed.intent)
      ? parsed.intent
      : "unknown";

    const parsedCoins =
      Array.isArray(parsed?.entities?.coins) &&
      parsed.entities.coins.every((v: any) => typeof v === "string")
        ? parsed.entities.coins.map((c: string) => c.toLowerCase())
        : coins;

    const parsedUsers =
      Array.isArray(parsed?.entities?.users) &&
      parsed.entities.users.every((v: any) => typeof v === "string")
        ? parsed.entities.users.map((u: string) => u.toLowerCase())
        : users;

    // 🧼 Post-validation correction: if category intent but no match, downgrade to unknown
    const isInvalidCategory =
      parsedIntent === "category_coins" &&
      !parsed.entities?.category &&
      !categoryMatch;

    return {
      intent: isInvalidCategory ? "unknown" : (parsedIntent as ChatIntent),
      entities: {
        coins: [...new Set(parsedCoins)],
        users: [...new Set(parsedUsers)],
        ...(parsed.entities?.category && {
          category: parsed.entities.category,
        }),
        ...(parsed.entities?.count && { count: parsed.entities.count }),
      },
      context: parsed.context || "User asked a question",
    };
  } catch (error) {
    console.error("❌ usePromptParser failed:", error);
    return {
      intent: "unknown",
      entities: { coins: [], users: [] },
      context: "Parsing failed — try again.",
    };
  }
}
