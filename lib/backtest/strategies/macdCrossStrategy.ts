// lib/strategies/macdCrossStrategy.ts

import { calculateEMA } from "@/utils/calculateEMA";
import type { BacktestResult, Trade } from "@/lib/backtest/runBacktests";

export const macdCrossStrategyName = "MACD Cross Strategy";

type Config = {
  direction: "long" | "short" | "both";
  leverage: number;
};

export function macdCrossStrategy(
  prices: number[][],
  config: Config
): BacktestResult {
  const { direction, leverage } = config;
  const close = prices.map(([, price]) => price);

  // Enhanced logging to verify the direction parameter
  console.log(
    `MACD Strategy received direction: "${direction}" (type: ${typeof direction})`
  );

  if (close.length < 35) return emptyResult();

  const ema12 = calculateEMA(close, 12);
  const ema26 = calculateEMA(close, 26);
  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = calculateEMA(macd, 9);

  // Create a new array for trades
  const trades: Trade[] = [];

  // CRITICAL: Completely disable trade generation for unselected directions
  const generateLongs = direction === "long" || direction === "both";
  const generateShorts = direction === "short" || direction === "both";

  console.log(
    `MACD Strategy - Trade generation: Longs: ${generateLongs}, Shorts: ${generateShorts}`
  );

  // Only initialize these variables if we're trading longs
  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;

  // Only initialize these variables if we're trading shorts
  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;

  const minHoldBars = 6;
  const cooldownBars = 10;
  const stopLossPercent = 10;
  let cooldownUntil = 0;

  for (let i = 1; i < macd.length; i++) {
    const idx = i + (prices.length - macd.length);
    const price = prices[idx][1];
    const prevDiff = macd[i - 1] - signal[i - 1];
    const currDiff = macd[i] - signal[i];
    const crossedUp = prevDiff < 0 && currDiff > 0;
    const crossedDown = prevDiff > 0 && currDiff < 0;

    if (idx < cooldownUntil) continue;

    // === LONG ENTRY ===
    // Only enter long positions if direction is "long" or "both"
    if (generateLongs && crossedUp && longEntryIndex === null) {
      longEntryIndex = idx;
      longEntryPrice = price;
    }

    // === LONG EXIT ===
    // Only process long exits if longs are enabled
    if (generateLongs && longEntryIndex !== null) {
      const barsHeld = idx - longEntryIndex;
      const pnl = ((price - longEntryPrice) / longEntryPrice) * 100;
      const trendFading = Math.abs(currDiff) < Math.abs(prevDiff);
      const stopLossHit = pnl <= -stopLossPercent;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (crossedDown) reason = "MACD cross";
      else if (trendFading) reason = "trend fade";
      else if (i === macd.length - 1) reason = "time expiry";

      const shouldExit = reason !== null && barsHeld >= minHoldBars;

      if (shouldExit) {
        const trade = {
          entryIndex: longEntryIndex,
          exitIndex: idx,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: pnl * leverage,
          direction: "long" as const,
          entryAction: "buy to open" as const,
          exitAction: "sell to close" as const,
          exitReason: reason!,
        };

        trades.push(trade);

        longEntryIndex = null;
        cooldownUntil = idx + cooldownBars;
      }
    }

    // === SHORT ENTRY ===
    // Only enter short positions if direction is "short" or "both"
    if (generateShorts && crossedDown && shortEntryIndex === null) {
      shortEntryIndex = idx;
      shortEntryPrice = price;
    }

    // === SHORT EXIT ===
    // Only process short exits if shorts are enabled
    if (generateShorts && shortEntryIndex !== null) {
      const barsHeld = idx - shortEntryIndex;
      const pnl = ((shortEntryPrice - price) / shortEntryPrice) * 100;
      const trendFading = Math.abs(currDiff) < Math.abs(prevDiff);
      const stopLossHit = pnl <= -stopLossPercent;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (crossedUp) reason = "MACD cross";
      else if (trendFading) reason = "trend fade";
      else if (i === macd.length - 1) reason = "time expiry";

      const shouldExit = reason !== null && barsHeld >= minHoldBars;

      if (shouldExit) {
        const trade = {
          entryIndex: shortEntryIndex,
          exitIndex: idx,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: pnl * leverage,
          direction: "short" as const,
          entryAction: "sell to open" as const,
          exitAction: "buy to close" as const,
          exitReason: reason!,
        };

        trades.push(trade);

        shortEntryIndex = null;
        cooldownUntil = idx + cooldownBars;
      }
    }
  }

  console.log(
    `MACD Strategy final trades: ${trades.length} trades, all with direction: ${
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
    strategyName: macdCrossStrategyName,
  };
}

function emptyResult(): BacktestResult {
  return {
    trades: [],
    totalReturn: 0,
    winRate: 0,
    strategyName: macdCrossStrategyName,
  };
}
