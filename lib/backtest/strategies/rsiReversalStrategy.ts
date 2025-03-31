// lib/backtest/strategies/rsiReversalStrategy.ts

import { calculateRSI } from "@/lib/indicators/calculateIndicators";

type BacktestResult = {
  trades: {
    entryIndex: number;
    exitIndex: number;
    entryPrice: number;
    exitPrice: number;
    profitPercent: number;
  }[];
  totalReturn: number;
  winRate: number;
  strategyName: string;
};

export function rsiReversalStrategy(prices: number[][]): BacktestResult {
  const rsiPeriod = 14;
  const rsiSeries: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    const slice = prices.slice(Math.max(i - rsiPeriod, 0), i + 1);
    if (slice.length < rsiPeriod) {
      rsiSeries.push(NaN);
    } else {
      rsiSeries.push(calculateRSI(slice));
    }
  }

  const trades: BacktestResult["trades"] = [];
  let inTrade = false;
  let entryIndex = 0;

  for (let i = rsiPeriod; i < prices.length; i++) {
    const rsi = rsiSeries[i];
    const price = prices[i][1];
    if (!inTrade && rsi < 30) {
      // Entry condition: RSI oversold
      inTrade = true;
      entryIndex = i;
    } else if (inTrade && rsi > 50) {
      // Exit condition: RSI recovery
      const entryPrice = prices[entryIndex][1];
      const exitPrice = price;
      const profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
      trades.push({
        entryIndex,
        exitIndex: i,
        entryPrice,
        exitPrice,
        profitPercent,
      });
      inTrade = false;
    }
  }

  const totalReturn = trades.reduce((acc, t) => acc + t.profitPercent, 0);
  const winRate =
    trades.length > 0
      ? trades.filter((t) => t.profitPercent > 0).length / trades.length
      : 0;

  return {
    trades,
    totalReturn,
    winRate: parseFloat((winRate * 100).toFixed(2)),
    strategyName: "RSI Reversal Strategy",
  };
}
