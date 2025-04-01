// lib/backtest/strategies/rsiReversalStrategy.ts

import { calculateRSI } from "@/lib/indicators/calculateIndicators";
import { BacktestResult, Trade } from "../runBacktests";

export const rsiReversalStrategyName = "RSI Reversal Strategy";

type Config = {
  direction: "long" | "short" | "both";
  leverage: number;
};

export function rsiReversalStrategy(
  prices: number[][],
  config: Config
): BacktestResult {
  const { direction, leverage } = config;
  const rsiPeriod = 14;
  const cooldownPeriod = 10; // bars to wait after trade before re-entering
  const stopLossPercent = 5; // hard stop loss (as %)

  const rsiSeries: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    const slice = prices.slice(Math.max(i - rsiPeriod, 0), i + 1);
    if (slice.length < rsiPeriod) {
      rsiSeries.push(NaN);
    } else {
      rsiSeries.push(calculateRSI(slice));
    }
  }

  const trades: Trade[] = [];

  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;

  let lastExitIndex = -cooldownPeriod; // to allow first entry

  for (let i = rsiPeriod; i < prices.length; i++) {
    const rsi = rsiSeries[i];
    const price = prices[i][1];

    // === LONG TRADES ===
    if (
      (direction === "long" || direction === "both") &&
      longEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi < 30
    ) {
      longEntryIndex = i;
      longEntryPrice = price;
    }

    // Exit Long if RSI > 50 or Stop Loss
    if (longEntryIndex !== null) {
      const unrealizedLoss = ((price - longEntryPrice) / longEntryPrice) * 100;
      const shouldStopLoss = unrealizedLoss < -stopLossPercent;

      if (rsi > 50 || shouldStopLoss || i === prices.length - 1) {
        const pnl =
          ((price - longEntryPrice) / longEntryPrice) * 100 * leverage;
        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "long",
        });

        lastExitIndex = i;
        longEntryIndex = null;
      }
    }

    // === SHORT TRADES ===
    if (
      (direction === "short" || direction === "both") &&
      shortEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi > 70
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
    }

    // Exit Short if RSI < 50 or Stop Loss
    if (shortEntryIndex !== null) {
      const unrealizedLoss =
        ((shortEntryPrice - price) / shortEntryPrice) * 100;
      const shouldStopLoss = unrealizedLoss < -stopLossPercent;

      if (rsi < 50 || shouldStopLoss || i === prices.length - 1) {
        const pnl =
          ((shortEntryPrice - price) / shortEntryPrice) * 100 * leverage;
        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "short",
        });

        lastExitIndex = i;
        shortEntryIndex = null;
      }
    }
  }

  const totalReturn = trades.reduce((sum, t) => sum + t.profitPercent, 0);
  const winRate =
    trades.length > 0
      ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) * 100
      : 0;

  return {
    trades,
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    strategyName: rsiReversalStrategyName,
  };
}
