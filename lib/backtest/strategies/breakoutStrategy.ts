import { calculateEMA } from "@/utils/calculateEMA";
import type { ExitReason, Trade, BacktestResult } from "@/types/backtest";

export const breakoutStrategyName = "Breakout Strategy";

export function breakoutStrategy(
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

  const lookback = 20;
  const threshold = 0.002;
  const closePrices = prices.map(([, p]) => p);
  const macdFast = calculateEMA(closePrices, 12);
  const macdSlow = calculateEMA(closePrices, 26);
  const macdLine = macdFast.map((v, i) => v - macdSlow[i]);

  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;
  let longPositionSize = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortPositionSize = 0;

  for (let i = lookback; i < prices.length; i++) {
    const price = prices[i][1];
    if (accountValue <= 0) break;

    const past = prices.slice(i - lookback, i).map(([, p]) => p);
    const high = Math.max(...past);
    const low = Math.min(...past);

    const brokeOut = price > high * (1 + threshold);
    const brokeDown = price < low * (1 - threshold);

    const momentumUp = i > 1 && macdLine[i] > macdLine[i - 1];
    const momentumDown = i > 1 && macdLine[i] < macdLine[i - 1];

    // === LONG ENTRY ===
    if (generateLongs && longEntryIndex === null && brokeOut && momentumUp) {
      longEntryIndex = i;
      longEntryPrice = price;
      longPositionSize = accountValue * 0.5;
    }

    // === SHORT ENTRY ===
    if (
      generateShorts &&
      shortEntryIndex === null &&
      brokeDown &&
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

      if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (price < high) exitReason = "fakeout";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveragedPnL = pnl * leverage;
        const profitAmount = (longPositionSize * leveragedPnL) / 100;
        const spotProfitAmount = (longPositionSize * pnl) / 100;

        accountValue += profitAmount;
        spotAccountValue += spotProfitAmount;

        // Liquidation guard
        accountValue = Math.max(0, accountValue);
        spotAccountValue = Math.max(0, spotAccountValue);

        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: leveragedPnL,
          spotProfitPercent: pnl,
          direction: "long",
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason,
          strategy: breakoutStrategyName,
          positionSize: longPositionSize,
          profitAmount,
          spotProfitAmount,
        });

        longEntryIndex = null;
      }
    }

    // === SHORT EXIT ===
    if (generateShorts && shortEntryIndex !== null) {
      const pnl = ((shortEntryPrice - price) / shortEntryPrice) * 100;
      let exitReason: ExitReason | null = null;

      if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (price > low) exitReason = "fakeout";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveragedPnL = pnl * leverage;
        const profitAmount = (shortPositionSize * leveragedPnL) / 100;
        const spotProfitAmount = (shortPositionSize * pnl) / 100;

        accountValue += profitAmount;
        spotAccountValue += spotProfitAmount;

        // Liquidation guard
        accountValue = Math.max(0, accountValue);
        spotAccountValue = Math.max(0, spotAccountValue);

        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: leveragedPnL,
          spotProfitPercent: pnl,
          direction: "short",
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason,
          strategy: breakoutStrategyName,
          positionSize: shortPositionSize,
          profitAmount,
          spotProfitAmount,
        });

        shortEntryIndex = null;
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
    strategyName: breakoutStrategyName,
    leverageUsed: leverage,
    spotAccountValue,
  };
}
