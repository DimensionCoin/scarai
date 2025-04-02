import { calculateRSI } from "@/lib/indicators/calculateIndicators";
import type { BacktestResult, Trade } from "@/lib/backtest/runBacktests";
import { calculateATR } from "@/utils/calculateATR"; // We'll need to create this

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
  const close = prices.map(([, price]) => price);
  const high = prices.map(([, price]) => price * 1.001); // Approximate high prices
  const low = prices.map(([, price]) => price * 0.999); // Approximate low prices

  const rsiPeriod = 14;
  const cooldownPeriod = 10;

  // Calculate ATR for dynamic stop loss and take profit
  const atrPeriod = 14;
  const atr = calculateATR(high, low, close, atrPeriod);

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
  let longStopLoss = 0;
  let longTakeProfit = 0;
  let longTrailingStop = 0;

  // Only initialize these variables if we're trading shorts
  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortStopLoss = 0;
  let shortTakeProfit = 0;
  let shortTrailingStop = 0;

  let lastExitIndex = -cooldownPeriod;

  // Calculate RSI values
  for (let i = 0; i < prices.length; i++) {
    const slice = prices.slice(Math.max(i - rsiPeriod, 0), i + 1);
    rsiSeries.push(slice.length < rsiPeriod ? Number.NaN : calculateRSI(slice));
  }

  // Calculate market conditions
  const isRangebound = (i: number): boolean => {
    if (i < 20) return false;

    const recentPrices = close.slice(i - 20, i);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const range = (high - low) / low;

    // If price range is less than 5%, consider it rangebound
    return range < 0.05;
  };

  // Calculate trend strength
  const trendStrength = (i: number): number => {
    if (i < 20) return 0;

    const recentPrices = close.slice(i - 20, i);
    let upDays = 0;

    for (let j = 1; j < recentPrices.length; j++) {
      if (recentPrices[j] > recentPrices[j - 1]) upDays++;
    }

    // Return a value between -1 (strong downtrend) and 1 (strong uptrend)
    return (upDays / (recentPrices.length - 1)) * 2 - 1;
  };

  for (let i = Math.max(rsiPeriod, atrPeriod); i < prices.length; i++) {
    const rsi = rsiSeries[i];
    const price = prices[i][1];
    const currentAtr = atr[i - atrPeriod] || atr[0];

    // Adjust RSI thresholds based on market conditions
    const marketRangebound = isRangebound(i);
    const strength = trendStrength(i);

    // Dynamic RSI thresholds based on market conditions
    const longEntryThreshold = marketRangebound
      ? 30
      : strength < -0.5
      ? 25
      : 35;
    const shortEntryThreshold = marketRangebound
      ? 70
      : strength > 0.5
      ? 75
      : 65;

    // Dynamic exit thresholds
    const longExitThreshold = marketRangebound ? 50 : 45;
    const shortExitThreshold = marketRangebound ? 50 : 55;

    // ATR multipliers for stop loss and take profit
    const stopLossMultiplier = 2.0;
    const takeProfitMultiplier = 3.0;
    const trailingStopMultiplier = 1.5;

    // === LONG ENTRY ===
    // Only enter long positions if direction is "long" or "both"
    if (
      generateLongs &&
      longEntryIndex === null &&
      i - lastExitIndex >= cooldownPeriod &&
      rsi < longEntryThreshold
    ) {
      // Additional confirmation: RSI is starting to turn up
      const rsiTurningUp = i > 0 && rsiSeries[i] > rsiSeries[i - 1];

      if (rsiTurningUp) {
        longEntryIndex = i;
        longEntryPrice = price;

        // Dynamic stop loss based on ATR
        longStopLoss = price - currentAtr * stopLossMultiplier;

        // Dynamic take profit based on ATR
        longTakeProfit = price + currentAtr * takeProfitMultiplier;

        // Initialize trailing stop
        longTrailingStop = price - currentAtr * trailingStopMultiplier;
      }
    }

    // === LONG EXIT ===
    // Only process long exits if longs are enabled
    if (generateLongs && longEntryIndex !== null) {
      const stopLossHit = price <= longStopLoss;
      const takeProfitHit = price >= longTakeProfit;
      const rsiExit = rsi > longExitThreshold;
      const lastBar = i === prices.length - 1;

      // Update trailing stop if price moves in our favor
      if (
        price > longEntryPrice &&
        price - currentAtr * trailingStopMultiplier > longTrailingStop
      ) {
        longTrailingStop = price - currentAtr * trailingStopMultiplier;
      }

      // Check if trailing stop is hit
      const trailingStopHit =
        price <= longTrailingStop && i - longEntryIndex >= 3;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (takeProfitHit) reason = "RSI target";
      else if (trailingStopHit) reason = "trend fade";
      else if (rsiExit) reason = "RSI exit";
      else if (lastBar) reason = "time expiry";

      if (reason) {
        const exitPrice =
          reason === "stop loss hit"
            ? longStopLoss
            : reason === "RSI target"
            ? longTakeProfit
            : reason === "trend fade"
            ? longTrailingStop
            : price;

        const actualPnl =
          ((exitPrice - longEntryPrice) / longEntryPrice) * 100 * leverage;

        const trade = {
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: exitPrice,
          profitPercent: actualPnl,
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
      rsi > shortEntryThreshold
    ) {
      // Additional confirmation: RSI is starting to turn down
      const rsiTurningDown = i > 0 && rsiSeries[i] < rsiSeries[i - 1];

      if (rsiTurningDown) {
        shortEntryIndex = i;
        shortEntryPrice = price;

        // Dynamic stop loss based on ATR
        shortStopLoss = price + currentAtr * stopLossMultiplier;

        // Dynamic take profit based on ATR
        shortTakeProfit = price - currentAtr * takeProfitMultiplier;

        // Initialize trailing stop
        shortTrailingStop = price + currentAtr * trailingStopMultiplier;
      }
    }

    // === SHORT EXIT ===
    // Only process short exits if shorts are enabled
    if (generateShorts && shortEntryIndex !== null) {
      const stopLossHit = price >= shortStopLoss;
      const takeProfitHit = price <= shortTakeProfit;
      const rsiExit = rsi < shortExitThreshold;
      const lastBar = i === prices.length - 1;

      // Update trailing stop if price moves in our favor
      if (
        price < shortEntryPrice &&
        price + currentAtr * trailingStopMultiplier < shortTrailingStop
      ) {
        shortTrailingStop = price + currentAtr * trailingStopMultiplier;
      }

      // Check if trailing stop is hit
      const trailingStopHit =
        price >= shortTrailingStop && i - shortEntryIndex >= 3;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (takeProfitHit) reason = "RSI target";
      else if (trailingStopHit) reason = "trend fade";
      else if (rsiExit) reason = "RSI exit";
      else if (lastBar) reason = "time expiry";

      if (reason) {
        const exitPrice =
          reason === "stop loss hit"
            ? shortStopLoss
            : reason === "RSI target"
            ? shortTakeProfit
            : reason === "trend fade"
            ? shortTrailingStop
            : price;

        const actualPnl =
          ((shortEntryPrice - exitPrice) / shortEntryPrice) * 100 * leverage;

        const trade = {
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: exitPrice,
          profitPercent: actualPnl,
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
