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
  const cooldownPeriod = 10;
  const stopLossPercent = 5;

  const trades: Trade[] = [];
  const rsiSeries: number[] = [];

  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;

  let lastExitIndex = -cooldownPeriod;

  for (let i = 0; i < prices.length; i++) {
    const slice = prices.slice(Math.max(i - rsiPeriod, 0), i + 1);
    rsiSeries.push(slice.length < rsiPeriod ? NaN : calculateRSI(slice));
  }

  for (let i = rsiPeriod; i < prices.length; i++) {
    const rsi = rsiSeries[i];
    const price = prices[i][1];

    // === LONG ENTRY ===
    if (
      (direction === "long" || direction === "both") &&
      longEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi < 30
    ) {
      longEntryIndex = i;
      longEntryPrice = price;
    }

    // === LONG EXIT ===
    if (longEntryIndex !== null) {
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

        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "long",
          entryAction: "buy to open", 
          exitAction: "sell to close", 
          exitReason: reason,
        });

        longEntryIndex = null;
        lastExitIndex = i;
      }
    }

    // === SHORT ENTRY ===
    if (
      (direction === "short" || direction === "both") &&
      shortEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi > 70
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
    }

    // === SHORT EXIT ===
    if (shortEntryIndex !== null) {
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

        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: pnl,
          direction: "short",
          entryAction: "sell to open", 
          exitAction: "buy to close", 
          exitReason: reason,
        });

        shortEntryIndex = null;
        lastExitIndex = i;
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
