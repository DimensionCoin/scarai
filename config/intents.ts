// config/intents.ts
export const VALID_INTENTS = [
  "coin_data",
  "coin_explanation",
  "trading_advice",
  "investment_advice",
  "investment_strategy",
  "category_coins",
  "top_coin_data",
  "market_data",
  "technical_analysis",
  "explain_concept",
  "trending",
  "compare",
  "unknown",
] as const;

export type ChatIntent = (typeof VALID_INTENTS)[number];
