// lib/strategies/rsiReversalStrategy.ts

import { calculateRSI } from "@/lib/indicators/calculateIndicators";
import type { BacktestResult, Trade } from "@/lib/backtest/runBacktests";

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
  const cooldownPeriod = 10;
  const stopLossPercent = 5;

  // Enhanced logging to verify the direction parameter
  console.log(
    `RSI Strategy received direction: "${direction}" (type: ${typeof direction})`
  );

  // Create a new array for trades
  const trades: Trade[] = [];
  const rsiSeries: number[] = [];

  // CRITICAL: Completely disable trade generation for unselected directions
  const generateLongs = direction === "long" || direction === "both";
  const generateShorts = direction === "short" || direction === "both";

  console.log(
    `RSI Strategy - Trade generation: Longs: ${generateLongs}, Shorts: ${generateShorts}`
  );

  // Only initialize these variables if we're trading longs
  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;

  // Only initialize these variables if we're trading shorts
  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;

  let lastExitIndex = -cooldownPeriod;

  for (let i = 0; i < prices.length; i++) {
    const slice = prices.slice(Math.max(i - rsiPeriod, 0), i + 1);
    rsiSeries.push(slice.length < rsiPeriod ? Number.NaN : calculateRSI(slice));
  }

  for (let i = rsiPeriod; i < prices.length; i++) {
    const rsi = rsiSeries[i];
    const price = prices[i][1];

    // === LONG ENTRY ===
    // Only enter long positions if direction is "long" or "both"
    if (
      generateLongs &&
      longEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi < 30
    ) {
      longEntryIndex = i;
      longEntryPrice = price;
    }

    // === LONG EXIT ===
    // Only process long exits if longs are enabled
    if (generateLongs && longEntryIndex !== null) {
      const unrealizedLoss = ((price - longEntryPrice) / longEntryPrice) * 100;
      const stopLossHit = unrealizedLoss <= -stopLossPercent;
      const rsiExit = rsi > 50;
      const lastBar = i === prices.length - 1;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (rsiExit) reason = "RSI exit";
      else if (lastBar) reason = "time expiry";

      if (reason) {
        const pnl =
          ((price - longEntryPrice) / longEntryPrice) * 100 * leverage;

        const trade = {
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "long" as const,
          entryAction: "buy to open" as const,
          exitAction: "sell to close" as const,
          exitReason: reason,
        };

        trades.push(trade);

        longEntryIndex = null;
        lastExitIndex = i;
      }
    }

    // === SHORT ENTRY ===
    // Only enter short positions if direction is "short" or "both"
    if (
      generateShorts &&
      shortEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi > 70
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
    }

    // === SHORT EXIT ===
    // Only process short exits if shorts are enabled
    if (generateShorts && shortEntryIndex !== null) {
      const unrealizedLoss =
        ((shortEntryPrice - price) / shortEntryPrice) * 100;
      const stopLossHit = unrealizedLoss <= -stopLossPercent;
      const rsiExit = rsi < 50;
      const lastBar = i === prices.length - 1;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (rsiExit) reason = "RSI exit";
      else if (lastBar) reason = "time expiry";

      if (reason) {
        const pnl =
          ((shortEntryPrice - price) / shortEntryPrice) * 100 * leverage;

        const trade = {
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "short" as const,
          entryAction: "sell to open" as const,
          exitAction: "buy to close" as const,
          exitReason: reason,
        };

        trades.push(trade);

        shortEntryIndex = null;
        lastExitIndex = i;
      }
    }
  }

  console.log(
    `RSI Strategy final trades: ${trades.length} trades, all with direction: ${
      direction === "both" ? "mixed" : direction
    }`
  );
  console.log(`Trade directions: ${trades.map((t) => t.direction).join(", ")}`);

  const totalReturn = trades.reduce((sum, t) => sum + t.profitPercent, 0);
  const winRate =
    trades.length > 0
      ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) * 100
      : 0;

  return {
    trades,
    totalReturn: Number.parseFloat(totalReturn.toFixed(2)),
    winRate: Number.parseFloat(winRate.toFixed(2)),
    strategyName: rsiReversalStrategyName,
  };
}
