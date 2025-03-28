import { ParsedQuery } from "./deepseekParser";
import {
  fetchCoinData,
  fetchMarketData,
  fetchTrendingCoins,
  fetchTopCoins,
  fetchCoinPriceHistory,
} from "@/lib/coinGecko";
import {
  coinData,
  explainConcept,
  marketData,
  Trending,
  topCoinData,
  technicalAnalysis,
  compare,
  investmentStategy,
  unknown,
  tradingAdvice,
} from "@/lib/intentPrompts";

export async function getIntentData(parsed: ParsedQuery) {
  const { intent, entities, context } = parsed;

  switch (intent) {
    case "coin_data": {
      const data = await fetchCoinData(entities.coins);
      return { systemPrompt: coinData, data };
    }

    case "market_data": {
      const data = await fetchMarketData();
      return { systemPrompt: marketData, data };
    }

    case "trending": {
      const data = await fetchTrendingCoins();
      return { systemPrompt: Trending, data };
    }

    case "top_coin_data": {
      const data = await fetchTopCoins();
      return { systemPrompt: topCoinData, data };
    }

    case "technical_analysis": {
      const slug = entities.coins?.[0];
      if (!slug) {
        return {
          systemPrompt: technicalAnalysis,
          data: "No coin specified for technical analysis.",
        };
      }
      const data = await fetchCoinPriceHistory(slug);
      return { systemPrompt: technicalAnalysis, data };
    }

    case "compare": {
      if (!entities.coins?.length) {
        return {
          systemPrompt: compare,
          data: "Please specify at least two coins to compare.",
        };
      }
      const comparisons = await Promise.all(
        entities.coins.map((coin) => fetchCoinPriceHistory(coin))
      );
      return {
        systemPrompt: compare,
        data: comparisons.join("\n\n---\n\n"),
      };
    }

    case "investment_strategy": {
      return {
        systemPrompt: investmentStategy,
        data: context,
      };
    }

    case "trading_advice": {
      const slug = entities.coins?.[0];
      if (!slug) {
        return {
          systemPrompt: tradingAdvice,
          data: "No coin specified for trading advice.",
        };
      }

      const [market, coinDataText, history, trending] = await Promise.all([
        fetchMarketData(),
        fetchCoinData([slug]),
        fetchCoinPriceHistory(slug),
        fetchTrendingCoins(),
      ]);

      const formatted = `
            ${coinDataText}

            ---

            ${history}

            ---

            ${market}

            ---

            ### Trending Coins
            ${trending}
`;

      return {
        systemPrompt: tradingAdvice,
        data: formatted,
      };
    }

    case "explain_concept": {
      return { systemPrompt: explainConcept, data: context };
    }

    default: {
      return { systemPrompt: unknown, data: context };
    }
  }
}
