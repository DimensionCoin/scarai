import { ChatIntent } from "@/types/ChatIntent";

import {coinData} from "./coinData";
import {tradingAdvice} from "./tradingAdvice";
import {investmentStrategy} from "./investmentStrategy";
import {categoryCoins} from "./categorCoins";
import {TopCoinData} from "./TopCoinData";
import {marketTrends} from "./marketTrends";
import {technicalAnalysis} from "./technicalAnalysis";
import {compare} from "./compare"
import {unknown} from "./unknown"
import { explainConcept } from "./explainConcept";
import { mixedIntent } from "./mixedIntent";
import { xPosts } from "./xPosts";

export const intentInstructions: Record<
  ChatIntent,
  string | ((...args: any[]) => string)
> = {
  coin_data: coinData,
  trading_advice: tradingAdvice,
  investment_strategy: investmentStrategy,
  category_coins: categoryCoins,
  top_coin_data: TopCoinData,
  market_trends: marketTrends,
  technical_analysis: technicalAnalysis,
  compare: compare,
  unknown: unknown,
  explain_concept: explainConcept,
  mixed: mixedIntent,
  x_posts: xPosts

};
