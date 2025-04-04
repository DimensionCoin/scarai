import { calculateEMA } from "@/utils/calculateEMA";
import type { ExitReason, Trade, BacktestResult } from "@/types/backtest";

export const macdCrossStrategyName = "MACD Cross Strategy";

export function macdCrossStrategy(
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

  const closePrices = prices.map(([, price]) => price);
  const ema12 = calculateEMA(closePrices, 12);
  const ema26 = calculateEMA(closePrices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const ema50 = calculateEMA(closePrices, 50);

  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;
  let longPositionSize = 0;
  let longHighWater = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortPositionSize = 0;
  let shortLowWater = Number.POSITIVE_INFINITY;

  let cooldown = 0;

  for (let i = 50; i < prices.length; i++) {
    const price = prices[i][1];
    if (accountValue <= 0) break;
    if (cooldown > 0) {
      cooldown--;
      continue;
    }

    const macd = macdLine[i];
    const macdPrev = macdLine[i - 1];
    const signal = signalLine[i];
    const signalPrev = signalLine[i - 1];
    const crossedUp = macdPrev < signalPrev && macd > signal && macd > macdPrev;
    const crossedDown =
      macdPrev > signalPrev && macd < signal && macd < macdPrev;
    const isBullish = price > ema50[i];
    const isBearish = price < ema50[i];

    // === LONG ENTRY ===
    if (generateLongs && longEntryIndex === null && crossedUp && isBullish) {
      longEntryIndex = i;
      longEntryPrice = price;
      longHighWater = price;
      longPositionSize = accountValue * 0.5;
    }

    // === SHORT ENTRY ===
    if (
      generateShorts &&
      shortEntryIndex === null &&
      crossedDown &&
      isBearish
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
      shortLowWater = price;
      shortPositionSize = accountValue * 0.5;
    }

    // === LONG EXIT ===
    if (generateLongs && longEntryIndex !== null) {
      longHighWater = Math.max(longHighWater, price);
      const pnl = ((price - longEntryPrice) / longEntryPrice) * 100;

      let exitReason: ExitReason | null = null;
      if (crossedDown) exitReason = "MACD cross";
      else if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (price < longHighWater * 0.975) exitReason = "trailing stop";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveraged = pnl * leverage;
        const profit = (longPositionSize * leveraged) / 100;
        const spotProfit = (longPositionSize * pnl) / 100;

        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: price,
          profitPercent: leveraged,
          spotProfitPercent: pnl,
          direction: "long",
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason,
          strategy: macdCrossStrategyName,
          positionSize: longPositionSize,
          profitAmount: profit,
          spotProfitAmount: spotProfit,
        });

        accountValue = Math.max(accountValue + profit, 0);
        spotAccountValue = Math.max(spotAccountValue + spotProfit, 0);
        longEntryIndex = null;
        cooldown = 3;
      }
    }

    // === SHORT EXIT ===
    if (generateShorts && shortEntryIndex !== null) {
      shortLowWater = Math.min(shortLowWater, price);
      const pnl = ((shortEntryPrice - price) / shortEntryPrice) * 100;

      let exitReason: ExitReason | null = null;
      if (crossedUp) exitReason = "MACD cross";
      else if (pnl <= -10) exitReason = "stop loss hit";
      else if (pnl >= 25) exitReason = "trend fade";
      else if (price > shortLowWater * 1.025) exitReason = "trailing stop";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const leveraged = pnl * leverage;
        const profit = (shortPositionSize * leveraged) / 100;
        const spotProfit = (shortPositionSize * pnl) / 100;

        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: price,
          profitPercent: leveraged,
          spotProfitPercent: pnl,
          direction: "short",
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason,
          strategy: macdCrossStrategyName,
          positionSize: shortPositionSize,
          profitAmount: profit,
          spotProfitAmount: spotProfit,
        });

        accountValue = Math.max(accountValue + profit, 0);
        spotAccountValue = Math.max(spotAccountValue + spotProfit, 0);
        shortEntryIndex = null;
        cooldown = 3;
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
    strategyName: macdCrossStrategyName,
    leverageUsed: leverage,
    spotAccountValue,
  };
}
