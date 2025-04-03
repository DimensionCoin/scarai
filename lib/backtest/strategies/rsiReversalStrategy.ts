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
  console.log(
    `Running RSI Reversal Strategy with amount: $${config.amount}, leverage: ${config.leverage}x`
  );

  const { direction, leverage, amount } = config;
  const generateLongs = direction === "long" || direction === "both";
  const generateShorts = direction === "short" || direction === "both";

  // Initialize variables
  const trades: Trade[] = [];
  let accountValue = amount;
  let spotAccountValue = amount; // Track spot trading account value

  // Track entry points
  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;
  let longPositionSize = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortPositionSize = 0;

  // RSI parameters
  const oversoldThreshold = 30;
  const overboughtThreshold = 70;
  const exitThreshold = 50;

  // Process each price point
  for (let i = 14; i < prices.length; i++) {
    const price = prices[i][1];
    const rsi = calculateRSI(prices.slice(0, i + 1));
    const prevRsi = i > 14 ? calculateRSI(prices.slice(0, i)) : 50;

    // LONG ENTRY - RSI crosses above oversold threshold
    if (
      generateLongs &&
      longEntryIndex === null &&
      prevRsi < oversoldThreshold &&
      rsi >= oversoldThreshold
    ) {
      longEntryIndex = i;
      longEntryPrice = price;
      longPositionSize = amount / 2; // Use half the account for each position
      console.log(
        `RSI Long Entry at $${price.toFixed(2)}, RSI: ${rsi.toFixed(
          2
        )}, Position Size: $${longPositionSize.toFixed(2)}`
      );
    }

    // SHORT ENTRY - RSI crosses below overbought threshold
    if (
      generateShorts &&
      shortEntryIndex === null &&
      prevRsi > overboughtThreshold &&
      rsi <= overboughtThreshold
    ) {
      shortEntryIndex = i;
      shortEntryPrice = price;
      shortPositionSize = amount / 2; // Use half the account for each position
      console.log(
        `RSI Short Entry at $${price.toFixed(2)}, RSI: ${rsi.toFixed(
          2
        )}, Position Size: $${shortPositionSize.toFixed(2)}`
      );
    }

    // LONG EXIT - RSI crosses above exit threshold or last bar
    if (generateLongs && longEntryIndex !== null) {
      let exitReason: ExitReason | null = null;

      if (rsi > exitThreshold) exitReason = "RSI exit";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const exitPrice = price;
        const profitPercent =
          ((exitPrice - longEntryPrice) / longEntryPrice) * 100;
        const leveragedProfitPercent = profitPercent * leverage;
        const profitAmount =
          (longPositionSize * profitPercent * leverage) / 100;
        const spotProfitAmount = (longPositionSize * profitPercent) / 100; // Spot profit without leverage

        console.log(
          `RSI Long Exit - Entry: $${longEntryPrice.toFixed(
            2
          )}, Exit: $${exitPrice.toFixed(2)}, ` +
            `PnL: ${profitPercent.toFixed(
              2
            )}%, Leveraged PnL: ${leveragedProfitPercent.toFixed(2)}%, ` +
            `Amount: $${profitAmount.toFixed(
              2
            )}, Spot Amount: $${spotProfitAmount.toFixed(2)}`
        );

        accountValue += profitAmount;
        spotAccountValue += spotProfitAmount; // Update spot account value

        trades.push({
          entryIndex: longEntryIndex,
          exitIndex: i,
          entryPrice: longEntryPrice,
          exitPrice: exitPrice,
          profitPercent: leveragedProfitPercent,
          spotProfitPercent: profitPercent, // Add spot profit percent
          direction: "long" as const,
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason: exitReason,
          strategy: rsiReversalStrategyName, // Add the strategy name
          positionSize: longPositionSize,
          profitAmount: profitAmount,
          spotProfitAmount: spotProfitAmount, // Add spot profit amount
        });

        longEntryIndex = null;
      }
    }

    // SHORT EXIT - RSI crosses below exit threshold or last bar
    if (generateShorts && shortEntryIndex !== null) {
      let exitReason: ExitReason | null = null;

      if (rsi < exitThreshold) exitReason = "RSI exit";
      else if (i === prices.length - 1) exitReason = "time expiry";

      if (exitReason) {
        const exitPrice = price;
        const profitPercent =
          ((shortEntryPrice - exitPrice) / shortEntryPrice) * 100;
        const leveragedProfitPercent = profitPercent * leverage;
        const profitAmount =
          (shortPositionSize * profitPercent * leverage) / 100;
        const spotProfitAmount = (shortPositionSize * profitPercent) / 100; // Spot profit without leverage

        console.log(
          `RSI Short Exit - Entry: $${shortEntryPrice.toFixed(
            2
          )}, Exit: $${exitPrice.toFixed(2)}, ` +
            `PnL: ${profitPercent.toFixed(
              2
            )}%, Leveraged PnL: ${leveragedProfitPercent.toFixed(2)}%, ` +
            `Amount: $${profitAmount.toFixed(
              2
            )}, Spot Amount: $${spotProfitAmount.toFixed(2)}`
        );

        accountValue += profitAmount;
        spotAccountValue += spotProfitAmount; // Update spot account value

        trades.push({
          entryIndex: shortEntryIndex,
          exitIndex: i,
          entryPrice: shortEntryPrice,
          exitPrice: exitPrice,
          profitPercent: leveragedProfitPercent,
          spotProfitPercent: profitPercent, // Add spot profit percent
          direction: "short" as const,
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason: exitReason,
          strategy: rsiReversalStrategyName, // Add the strategy name
          positionSize: shortPositionSize,
          profitAmount: profitAmount,
          spotProfitAmount: spotProfitAmount, // Add spot profit amount
        });

        shortEntryIndex = null;
      }
    }
  }

  // Calculate performance metrics
  const totalReturn = ((accountValue - amount) / amount) * 100;
  const spotTotalReturn = ((spotAccountValue - amount) / amount) * 100;
  const winRate =
    trades.length > 0
      ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) * 100
      : 0;

  console.log(
    `RSI Strategy completed with ${
      trades.length
    } trades, Total Return: ${totalReturn.toFixed(
      2
    )}%, Spot Return: ${spotTotalReturn.toFixed(2)}%`
  );

  return {
    trades,
    totalReturn,
    spotTotalReturn, // Add spot total return
    winRate,
    strategyName: rsiReversalStrategyName,
    leverageUsed: leverage, // Add leverage used
    spotAccountValue, // Add spot account value
  };
}
