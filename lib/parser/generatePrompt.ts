import { VALID_INTENTS } from "@/config/intents";

export function generatePrompt(message: string, context: string): string {
  return `
You are a crypto AI prompt parser. Given a user's message and recent context, return ONLY a valid JSON string with:

- intent: what type of response the user wants — choose ONE of:
  ${VALID_INTENTS.map((i) => `"${i}"`).join(", ")}

  - "coin_data" → the user wants real-time stats or numbers about a coin
  - "coin_explanation" → the user wants to understand *what* a coin is
  - "investment_advice" → the user is asking how for investment advice on how to allocate their funds.
  - "trading_advice" → the user wants specific buy/sell strategy for current conditions
  - "investment_strategy" → the user is asking about long-term positioning, planning, day trading and different strategies
  - "category_coins" → the user wants coins in a specific sector or category
  - "top_coin_data" → the user is asking for top coins by some ranking
  - "market_data" → user wants to know what’s happening broadly in the market
  - "technical_analysis" → the user wants a chart read or a current indicator value
  - "explain_concept" → the user wants to learn about a concept like RSI, trendlines, analyzing charts etc..
  - "trending" → the user is asking about the top trending coins right now 
  - "compare" → the user wants to comapre the price performace of 2 coins
  - "unknown" → if unsure

- entities: { coins: ["/coin1"], category?: "category_id", count?: number }

- context: A short summary of what the user is asking

Example 1:
User: "What’s the RSI for Solana?"
→ intent: "technical_analysis"

Example 2:
User: "What is RSI and how does it work?"
→ intent: "explain_concept"

Example 3:
User: "How would you trade /eth right now?"
→ intent: "trading_advice"

Eample 4:
User: "compare /solana and /bitcoin"
→ intent: "compare"

Example 5:
User: "what are trading strategies like scalping"
→ inent: "investment_strategy"

Example 6:
User: "if you had $400 how would you put it into /solana /drift-protocol"
→ intent: "investment_advice"

Input Message:
"${message}"

Recent Context:
${context}

Return only valid JSON with no extra text.
`.trim();
}
