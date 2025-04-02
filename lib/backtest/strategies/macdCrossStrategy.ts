import { calculateEMA } from "@/utils/calculateEMA";
import type { BacktestResult, Trade } from "@/lib/backtest/runBacktests";
import { calculateATR } from "@/utils/calculateATR"; // We'll need to create this

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
  const high = prices.map(([, price]) => price * 1.001); // Approximate high prices
  const low = prices.map(([, price]) => price * 0.999); // Approximate low prices

  console.log(
    `MACD Strategy received direction: "${direction}" (type: ${typeof direction})`
  );

  if (close.length < 35) return emptyResult();

  // Calculate MACD components
  const ema12 = calculateEMA(close, 12);
  const ema26 = calculateEMA(close, 26);
  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = calculateEMA(macd, 9);

  // Calculate ATR for dynamic stop loss and take profit
  const atrPeriod = 14;
  const atr = calculateATR(high, low, close, atrPeriod);

  // Calculate market volatility
  const volatilityWindow = 20;
  const volatility = calculateVolatility(close, volatilityWindow);

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
  let longStopLoss = 0;
  let longTakeProfit = 0;
  let longTrailingStop = 0;

  // Only initialize these variables if we're trading shorts
  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortStopLoss = 0;
  let shortTakeProfit = 0;
  let shortTrailingStop = 0;

  const minHoldBars = 6;
  const cooldownBars = 10;
  let cooldownUntil = 0;

  // Market condition filter
  const isUptrend = (i: number) => {
    // Simple uptrend definition: price above 50-period EMA
    const ema50 = calculateEMA(close.slice(0, i + 1), 50);
    return close[i] > ema50[ema50.length - 1];
  };

  // Volume filter (simulated since we don't have actual volume data)
  const hasVolumeConfirmation = () => {
    // In a real implementation, you would check if volume is increasing
    // For this simulation, we'll assume 70% of signals have volume confirmation
    return Math.random() > 0.3;
  };

  for (let i = Math.max(volatilityWindow, atrPeriod); i < macd.length; i++) {
    const idx = i + (prices.length - macd.length);
    const price = prices[idx][1];
    const prevDiff = macd[i - 1] - signal[i - 1];
    const currDiff = macd[i] - signal[i];
    const crossedUp = prevDiff < 0 && currDiff > 0;
    const crossedDown = prevDiff > 0 && currDiff < 0;

    // Current ATR value for dynamic stops
    const currentAtr = atr[idx - atrPeriod] || atr[0];

    // Current volatility - adjust parameters based on market conditions
    const currentVolatility =
      volatility[idx - volatilityWindow] || volatility[0];
    const isHighVolatility = currentVolatility > 1.5; // Threshold for high volatility

    // Adjust stop loss and take profit multipliers based on volatility
    const stopLossMultiplier = isHighVolatility ? 3.0 : 2.5;
    const takeProfitMultiplier = isHighVolatility ? 4.0 : 3.0;
    const trailingStopMultiplier = 2.0;

    if (idx < cooldownUntil) continue;

    // === LONG ENTRY ===
    // Only enter long positions if direction is "long" or "both"
    if (generateLongs && crossedUp && longEntryIndex === null) {
      // Additional filters for higher quality entries
      const trendConfirmation = isUptrend(idx);
      const volumeConfirmation = hasVolumeConfirmation();

      // Only enter if we have confirmation from trend and volume
      if (trendConfirmation && volumeConfirmation) {
        longEntryIndex = idx;
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
      const barsHeld = idx - longEntryIndex;
      // We'll use actualPnl instead of pnl
      const trendFading = Math.abs(currDiff) < Math.abs(prevDiff);
      const stopLossHit = price <= longStopLoss;
      const takeProfitHit = price >= longTakeProfit;

      // Update trailing stop if price moves in our favor
      if (
        price > longEntryPrice &&
        price - currentAtr * trailingStopMultiplier > longTrailingStop
      ) {
        longTrailingStop = price - currentAtr * trailingStopMultiplier;
      }

      // Check if trailing stop is hit
      const trailingStopHit =
        price <= longTrailingStop && barsHeld >= minHoldBars;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (takeProfitHit)
        reason = "RSI target"; // Using RSI target as take profit label
      else if (trailingStopHit)
        reason = "trend fade"; // Using trend fade as trailing stop label
      else if (crossedDown) reason = "MACD cross";
      else if (trendFading && barsHeld >= minHoldBars * 2)
        reason = "trend fade";
      else if (i === macd.length - 1) reason = "time expiry";

      const shouldExit = reason !== null && barsHeld >= minHoldBars;

      if (shouldExit) {
        const exitPrice =
          reason === "stop loss hit"
            ? longStopLoss
            : reason === "RSI target"
            ? longTakeProfit
            : reason === "trend fade" && trailingStopHit
            ? longTrailingStop
            : price;

        const actualPnl = ((exitPrice - longEntryPrice) / longEntryPrice) * 100;

        const trade = {
          entryIndex: longEntryIndex,
          exitIndex: idx,
          entryPrice: longEntryPrice,
          exitPrice: exitPrice,
          profitPercent: actualPnl * leverage,
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
      // Additional filters for higher quality entries
      const trendConfirmation = !isUptrend(idx);
      const volumeConfirmation = hasVolumeConfirmation();

      // Only enter if we have confirmation from trend and volume
      if (trendConfirmation && volumeConfirmation) {
        shortEntryIndex = idx;
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
      const barsHeld = idx - shortEntryIndex;
      // We'll use actualPnl instead of pnl
      const trendFading = Math.abs(currDiff) < Math.abs(prevDiff);
      const stopLossHit = price >= shortStopLoss;
      const takeProfitHit = price <= shortTakeProfit;

      // Update trailing stop if price moves in our favor
      if (
        price < shortEntryPrice &&
        price + currentAtr * trailingStopMultiplier < shortTrailingStop
      ) {
        shortTrailingStop = price + currentAtr * trailingStopMultiplier;
      }

      // Check if trailing stop is hit
      const trailingStopHit =
        price >= shortTrailingStop && barsHeld >= minHoldBars;

      let reason: Trade["exitReason"] | null = null;
      if (stopLossHit) reason = "stop loss hit";
      else if (takeProfitHit)
        reason = "RSI target"; // Using RSI target as take profit label
      else if (trailingStopHit)
        reason = "trend fade"; // Using trend fade as trailing stop label
      else if (crossedUp) reason = "MACD cross";
      else if (trendFading && barsHeld >= minHoldBars * 2)
        reason = "trend fade";
      else if (i === macd.length - 1) reason = "time expiry";

      const shouldExit = reason !== null && barsHeld >= minHoldBars;

      if (shouldExit) {
        const exitPrice =
          reason === "stop loss hit"
            ? shortStopLoss
            : reason === "RSI target"
            ? shortTakeProfit
            : reason === "trend fade" && trailingStopHit
            ? shortTrailingStop
            : price;

        const actualPnl =
          ((shortEntryPrice - exitPrice) / shortEntryPrice) * 100;

        const trade = {
          entryIndex: shortEntryIndex,
          exitIndex: idx,
          entryPrice: shortEntryPrice,
          exitPrice: exitPrice,
          profitPercent: actualPnl * leverage,
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

// Calculate volatility over a given window
function calculateVolatility(prices: number[], window: number): number[] {
  const volatility: number[] = [];

  for (let i = window; i < prices.length; i++) {
    const windowPrices = prices.slice(i - window, i);
    const returns = windowPrices
      .map((price, j) =>
        j === 0 ? 0 : (price - windowPrices[j - 1]) / windowPrices[j - 1]
      )
      .slice(1);

    // Calculate standard deviation of returns
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map((ret) => Math.pow(ret - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    volatility.push(stdDev * 100); // Convert to percentage
  }

  // Pad the beginning with the first calculated value
  const firstValue = volatility[0] || 1;
  return Array(window).fill(firstValue).concat(volatility);
}

function emptyResult(): BacktestResult {
  return {
    trades: [],
    totalReturn: 0,
    winRate: 0,
    strategyName: macdCrossStrategyName,
  };
}
