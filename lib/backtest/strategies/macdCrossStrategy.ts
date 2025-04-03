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
  console.log(
    `Running MACD Cross Strategy with amount: $${config.amount}, leverage: ${config.leverage}x`
  );

  const { direction, leverage, amount } = config;
  const generateLongs = direction === "long" || direction === "both";
  const generateShorts = direction === "short" || direction === "both";

  // Initialize variables
  const trades: Trade[] = [];
  let accountValue = amount;
  let spotAccountValue = amount; // Track spot trading account value

  // Calculate MACD
  const closePrices = prices.map(([, price]) => price);
  const ema12 = calculateEMA(closePrices, 12);
  const ema26 = calculateEMA(closePrices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);

  // Track entry points
  let longEntryIndex: number | null = null;
  let longEntryPrice = 0;
  let longPositionSize = 0;

  let shortEntryIndex: number | null = null;
  let shortEntryPrice = 0;
  let shortPositionSize = 0;

  // Process each price point
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i][1];
    // const prevPrice = prices[i - 1][1] - removed unused variable

    // Check for MACD crossovers
    const crossedUp =
      macdLine[i - 1] < signalLine[i - 1] && macdLine[i] > signalLine[i];
    const crossedDown =
      macdLine[i - 1] > signalLine[i - 1] && macdLine[i] < signalLine[i];

    // LONG ENTRY
    if (generateLongs && longEntryIndex === null && crossedUp) {
      longEntryIndex = i;
      longEntryPrice = price;
      longPositionSize = amount / 2; // Use half the account for each position
      console.log(
        `MACD Long Entry at $${price.toFixed(
          2
        )}, Position Size: $${longPositionSize.toFixed(2)}`
      );
    }

    // SHORT ENTRY
    if (generateShorts && shortEntryIndex === null && crossedDown) {
      shortEntryIndex = i;
      shortEntryPrice = price;
      shortPositionSize = amount / 2; // Use half the account for each position
      console.log(
        `MACD Short Entry at $${price.toFixed(
          2
        )}, Position Size: $${shortPositionSize.toFixed(2)}`
      );
    }

    // LONG EXIT
    if (generateLongs && longEntryIndex !== null) {
      let exitReason: ExitReason | null = null;

      if (crossedDown) exitReason = "MACD cross";
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
          `MACD Long Exit - Entry: $${longEntryPrice.toFixed(
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
          direction: "long" as const, // Ensure this is explicitly typed as "long"
          entryAction: "buy to open",
          exitAction: "sell to close",
          exitReason: exitReason,
          strategy: macdCrossStrategyName, // Add the strategy name
          positionSize: longPositionSize,
          profitAmount: profitAmount,
          spotProfitAmount: spotProfitAmount, // Add spot profit amount
        });

        longEntryIndex = null;
      }
    }

    // SHORT EXIT
    if (generateShorts && shortEntryIndex !== null) {
      let exitReason: ExitReason | null = null;

      if (crossedUp) exitReason = "MACD cross";
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
          `MACD Short Exit - Entry: $${shortEntryPrice.toFixed(
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
          direction: "short" as const, // Add "as const" to ensure it's typed as "short"
          entryAction: "sell to open",
          exitAction: "buy to close",
          exitReason: exitReason,
          strategy: macdCrossStrategyName, // Add the strategy name
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
    `MACD Strategy completed with ${
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
    strategyName: macdCrossStrategyName,
    leverageUsed: leverage, // Add leverage used
    spotAccountValue, // Add spot account value
  };
}
