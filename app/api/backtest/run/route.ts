import { type NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// Import strategy functions directly
import { macdCrossStrategy } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "@/lib/backtest/strategies/rsiReversalStrategy";

// Define strategy registry directly here
const strategyRegistry = {
  "MACD Cross Strategy": "macdCrossStrategy",
  "RSI Reversal Strategy": "rsiReversalStrategy",
};

// Local strategy function map
const strategyFunctions = {
  macdCrossStrategy,
  rsiReversalStrategy,
};

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    console.log("API route handler started");

    // Parse request body
    const body = await req.json();
    console.log("Request body:", body);

    // Extract and validate amount
    const {
      coin,
      amount: initialAmount,
      strategies = [],
      direction = "both",
      leverage: initialLeverage = 1,
    } = body;

    // Convert amount to number if it's a string
    let amount =
      typeof initialAmount === "string"
        ? Number.parseFloat(initialAmount)
        : initialAmount;
    let leverage = initialLeverage;

    // Validate amount is a number and positive
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      console.warn(`Invalid amount received: ${amount}, using default 1000`);
      amount = 1000;
    }

    console.log(`API received amount: $${amount} (type: ${typeof amount})`);
    console.log(
      `API received leverage: ${leverage}x (type: ${typeof leverage})`
    );

    // Ensure leverage is a number
    if (typeof leverage !== "number" || isNaN(leverage) || leverage < 1) {
      console.warn(`Invalid leverage received: ${leverage}, using default 1`);
      leverage = 1;
    }

    if (!coin || !strategies?.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    console.log(
      `Processing request for coin: ${coin}, strategies: ${strategies.join(
        ", "
      )}, direction: ${direction}, amount: $${amount}`
    );

    // === FETCH HISTORICAL PRICE DATA ===
    const now = Math.floor(Date.now() / 1000);
    const from = now - 90 * 24 * 60 * 60;

    console.log(`Fetching price data from CoinGecko for ${coin}`);
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=usd&from=${from}&to=${now}&precision=full`;

    const res = await fetchWithRetry(url, {
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY || "",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`CoinGecko API error: ${res.status} - ${errorText}`);
      throw new Error(`CoinGecko error: ${res.status} — ${errorText}`);
    }

    const data = await res.json();
    const prices = data.prices as number[][];
    console.log(`Received ${prices.length} price points from CoinGecko`);

    // Run strategies
    const results = [];
    console.log("Running strategies...");

    for (const strategyName of strategies) {
      console.log(`Processing strategy: ${strategyName}`);
      // Type guard to ensure strategyName is a valid key
      if (!(strategyName in strategyRegistry)) {
        console.warn(`Unknown strategy: ${strategyName}`);
        continue;
      }

      // Now TypeScript knows strategyName is a valid key
      const path =
        strategyRegistry[strategyName as keyof typeof strategyRegistry];
      const strategyFn =
        strategyFunctions[path as keyof typeof strategyFunctions];

      if (typeof strategyFn !== "function") {
        console.warn(`Strategy not found: ${strategyName}`);
        continue;
      }

      try {
        console.log(
          `Running ${strategyName} with direction: ${direction}, amount: $${amount}, leverage: ${leverage}x`
        );
        const result = strategyFn(prices, { direction, leverage, amount });
        console.log(
          `Strategy ${strategyName} completed with ${result.trades.length} trades`
        );
        results.push(result);
      } catch (error) {
        console.error(`Error running strategy ${strategyName}:`, error);
        throw new Error(
          `Strategy execution error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Flatten all trades and tag with strategy
    let allTrades = results.flatMap((r) =>
      r.trades.map((t) => ({
        ...t,
        strategy: r.strategyName,
      }))
    );

    if (direction !== "both") {
      allTrades = allTrades.filter((t) => t.direction === direction);
    }

    // Summary
    const summary = results.map((r) => {
      const trades = allTrades.filter((t) => t.strategy === r.strategyName);
      const totalProfitAmount = trades.reduce(
        (sum, t) => sum + (t.profitAmount || 0),
        0
      );
      const totalReturnPercent = (totalProfitAmount / amount) * 100;

      // Calculate spot profit and return
      const spotProfitAmount = trades.reduce(
        (sum, t) => sum + (t.spotProfitAmount || 0),
        0
      );
      const spotReturnPercent = (spotProfitAmount / amount) * 100;

      const winRate =
        trades.length > 0
          ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) *
            100
          : 0;

      console.log(
        `Summary for ${r.strategyName}: ` +
          `Profit $${totalProfitAmount.toFixed(
            2
          )}, Return ${totalReturnPercent.toFixed(2)}%, ` +
          `Spot Profit $${spotProfitAmount.toFixed(
            2
          )}, Spot Return ${spotReturnPercent.toFixed(2)}%, ` +
          `Based on amount $${amount}, Leverage: ${leverage}x`
      );

      return {
        strategyName: r.strategyName,
        totalReturn: Number.parseFloat(totalReturnPercent.toFixed(2)),
        spotReturn: Number.parseFloat(spotReturnPercent.toFixed(2)), // Add spot return
        winRate: Number.parseFloat(winRate.toFixed(2)),
        tradeCount: trades.length,
        profit: totalProfitAmount.toFixed(2),
        spotProfit: spotProfitAmount.toFixed(2), // Add spot profit
        leverageUsed: leverage, // Add leverage used
      };
    });

    console.log("API processing completed successfully");
    return NextResponse.json({
      summary,
      prices,
      trades: allTrades,
      direction,
      amount, // Include the amount in the response for verification
      leverage, // Include the leverage in the response
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Backtest error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
