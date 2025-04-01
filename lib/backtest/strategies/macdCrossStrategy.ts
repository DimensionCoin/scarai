import { calculateEMA } from "@/utils/calculateEMA";
import { BacktestResult, Trade } from "../runBacktests";

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

  if (close.length < 35) return emptyResult();

  const ema12 = calculateEMA(close, 12);
  const ema26 = calculateEMA(close, 26);
  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = calculateEMA(macd, 9);

  const trades: Trade[] = [];

  let longEntryIndex: number | null = null;
  let longEntryPrice: number = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice: number = 0;

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
    if (
      crossedUp &&
      (direction === "long" || direction === "both") &&
      longEntryIndex === null
    ) {
      longEntryIndex = idx;
      longEntryPrice = price;
    }

    // === LONG EXIT ===
    if (longEntryIndex !== null) {
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
        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: idx,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: pnl * leverage,
          direction: "long",
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason: reason!,
        });

        longEntryIndex = null;
        cooldownUntil = idx + cooldownBars;
      }
    }

    // === SHORT ENTRY ===
    if (
      crossedDown &&
      (direction === "short" || direction === "both") &&
      shortEntryIndex === null
    ) {
      shortEntryIndex = idx;
      shortEntryPrice = price;
    }

    // === SHORT EXIT ===
    if (shortEntryIndex !== null) {
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
        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: idx,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: pnl * leverage,
          direction: "short",
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason: reason!,
        });

        shortEntryIndex = null;
        cooldownUntil = idx + cooldownBars;
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
