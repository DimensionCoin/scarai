import { ParsedQuery } from "./deepseekParser";
import {
  fetchCoinData,
  fetchMarketData,
  fetchTrendingCoins,
  fetchTopCoins,
  fetchCoinPriceHistory,
  fetchBestTrade
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
  investmentAdvice,
  bestTradeToday
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

    case "investment_advice": {
      const coins = entities.coins || [];

      if (coins.length === 0) {
        return {
          systemPrompt: investmentAdvice,
          data: "No coins were provided for investment advice.",
        };
      }

      const [fundamentals, technicals, market] = await Promise.all([
        fetchCoinData(coins),
        Promise.all(coins.map((coin) => fetchCoinPriceHistory(coin))),
        fetchMarketData(),
      ]);

      const formatted = `
              ### Coin Fundamentals
              ${fundamentals}

              ---

              ### Technical Breakdown
              ${technicals.join("\n\n---\n\n")}

              ---

              ### Macro Conditions
              ${market}
  `.trim();

      return {
        systemPrompt: investmentAdvice,
        data: formatted,
      };
    }

    case "best_trade_today": {
      const data = await fetchBestTrade();
      return {
        systemPrompt: bestTradeToday,
        data,
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
