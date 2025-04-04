import { calculateRSI } from "@/lib/indicators/calculateIndicators";
import type { ExitReason, Trade, BacktestResult } from "@/types/backtest";

export const rsiReversalStrategyName = "RSI Reversal Strategy";

export function rsiReversalStrategy(
  prices: number[][],
  config: {
    direction: "long" | "short" | "both";
    leverage: number;
    amount: number;
  }
): BacktestResult {
  const { direction, leverage, amount } = config;
  const generateLongs = direction === "long" || direction === "both";
  const generateShorts = direction === "short" || direction === "both";

  const trades: Trade[] = [];
  let accountValue = amount;
  let spotAccountValue = amount;
  let cooldown = 0;

  const oversoldThreshold = 30;
  const overboughtThreshold = 70;
  const exitThreshold = 50;

  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;
  let longPositionSize = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortPositionSize = 0;

  for (let i = 14; i < prices.length; i++) {
    const price = prices[i][1];
    if (accountValue <= 0) break; // Simulate liquidation
    if (cooldown > 0) {
      cooldown--;
      continue;
    }

    const rsi = calculateRSI(prices.slice(0, i + 1));
    const prevRsi = calculateRSI(prices.slice(0, i)) || 50;
    const momentumUp = rsi > prevRsi;
    const momentumDown = rsi < prevRsi;

    // === LONG ENTRY ===
    if (
      generateLongs &&
      longEntryIndex === null &&
      prevRsi < oversoldThreshold &&
      rsi >= oversoldThreshold &&
      momentumUp
    ) {
      longEntryIndex = i;
      longEntryPrice = price;
      longPositionSize = accountValue * 0.5;
    }

    // === SHORT ENTRY ===
    if (
      generateShorts &&
      shortEntryIndex === null &&
      prevRsi > overboughtThreshold &&
      rsi <= overboughtThreshold &&
      momentumDown
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
      shortPositionSize = accountValue * 0.5;
    }

    // === LONG EXIT ===
    if (generateLongs && longEntryIndex !== null) {
      const pnl = ((price - longEntryPrice) / longEntryPrice) * 100;
      let exitReason: ExitReason | null = null;

      if (rsi > exitThreshold) exitReason = "RSI exit";
      else if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveragedPnl = pnl * leverage;
        const profitAmount = (longPositionSize * leveragedPnl) / 100;
        const spotProfitAmount = (longPositionSize * pnl) / 100;

        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: leveragedPnl,
          spotProfitPercent: pnl,
          direction: "long",
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason,
          strategy: rsiReversalStrategyName,
          positionSize: longPositionSize,
          profitAmount,
          spotProfitAmount,
        });

        accountValue = Math.max(accountValue + profitAmount, 0);
        spotAccountValue = Math.max(spotAccountValue + spotProfitAmount, 0);

        longEntryIndex = null;
        cooldown = 5;
      }
    }

    // === SHORT EXIT ===
    if (generateShorts && shortEntryIndex !== null) {
      const pnl = ((shortEntryPrice - price) / shortEntryPrice) * 100;
      let exitReason: ExitReason | null = null;

      if (rsi < exitThreshold) exitReason = "RSI exit";
      else if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveragedPnl = pnl * leverage;
        const profitAmount = (shortPositionSize * leveragedPnl) / 100;
        const spotProfitAmount = (shortPositionSize * pnl) / 100;

        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: leveragedPnl,
          spotProfitPercent: pnl,
          direction: "short",
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason,
          strategy: rsiReversalStrategyName,
          positionSize: shortPositionSize,
          profitAmount,
          spotProfitAmount,
        });

        accountValue = Math.max(accountValue + profitAmount, 0);
        spotAccountValue = Math.max(spotAccountValue + spotProfitAmount, 0);

        shortEntryIndex = null;
        cooldown = 5;
      }
    }
  }

  const totalReturn = ((accountValue - amount) / amount) * 100;
  const spotTotalReturn = ((spotAccountValue - amount) / amount) * 100;
  const winRate =
    trades.length > 0
      ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) * 100
      : 0;

  return {
    trades,
    totalReturn,
    spotTotalReturn,
    winRate,
    strategyName: rsiReversalStrategyName,
    leverageUsed: leverage,
    spotAccountValue,
  };
}
