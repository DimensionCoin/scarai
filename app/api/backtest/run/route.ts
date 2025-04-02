// API route handler for running backtests against historical cryptocurrency data
import { type NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { strategyRegistry } from "@/lib/backtest/strategies";
import type { BacktestResult } from "@/lib/backtest/runBacktests";
// Import strategy modules directly
import { macdCrossStrategy } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "@/lib/backtest/strategies/rsiReversalStrategy";

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

// Define a type for strategy functions
type StrategyFunction = (
  prices: number[][],
  config: {
    direction: "long" | "short" | "both";
    leverage: number;
  }
) => BacktestResult;

// Create a mapping of strategy paths to their functions
const strategyFunctions: Record<string, StrategyFunction> = {
  macdCrossStrategy: macdCrossStrategy,
  rsiReversalStrategy: rsiReversalStrategy,
};

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      const bodyText = await req.text();
      body = JSON.parse(bodyText);
    } catch {
      // Empty catch block without parameter
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Extract parameters from the parsed body with defaults
    const {
      coin, // Cryptocurrency ID (e.g., "bitcoin")
      amount, // Investment amount
      strategies, // Array of strategy names to run
      direction = "both", // Trade direction: "long", "short", or "both"
      leverage = 1, // Leverage multiplier
    } = body;

    // Validate required parameters
    if (!coin || !amount || !strategies?.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    // Calculate date range for historical data (90 days)
    const now = Math.floor(Date.now() / 1000);
    const from = now - 90 * 24 * 60 * 60;

    // Fetch historical price data from CoinGecko
    const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=usd&from=${from}&to=${now}&precision=full`;
    const res = await fetchWithRetry(url, {
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY || "",
      },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status} — ${await res.text()}`);
    }

    // Extract price data from response
    const data = await res.json();
    const prices = data.prices as number[][];

    // Run each selected strategy against the price data
    const results: BacktestResult[] = [];

    // Process strategies in parallel for better performance
    await Promise.all(
      strategies.map(async (strategyName: string) => {
        // Check if the strategy exists in our registry
        if (!(strategyName in strategyRegistry)) {
          console.warn(`Strategy not found in registry: ${strategyName}`);
          return;
        }

        const path =
          strategyRegistry[strategyName as keyof typeof strategyRegistry];

        // Get the strategy function from our mapping
        const strategyFn = strategyFunctions[path];

        if (typeof strategyFn === "function") {
          // Run the strategy with the specified direction and leverage
          const result = strategyFn(prices, {
            direction,
            leverage,
          });

          results.push(result);
        } else {
          console.warn(`Strategy function not found for: ${path}`);
        }
      })
    );

    // Combine trades from all strategies and add strategy name to each trade
    let allTrades = results.flatMap((r) =>
      r.trades.map((t) => ({
        ...t,
        strategy: r.strategyName,
        entryAction: t.entryAction,
        exitAction: t.exitAction,
        exitReason: t.exitReason,
      }))
    );

    // Filter trades to match the selected direction if not "both"
    if (direction !== "both") {
      allTrades = allTrades.filter((t) => t.direction === direction);
    }

    // Calculate summary statistics for each strategy
    const summary = results.map((r) => {
      // Get trades for this specific strategy
      const strategyTrades = allTrades.filter(
        (t) => t.strategy === r.strategyName
      );

      // Calculate performance metrics
      const totalReturn = strategyTrades.reduce(
        (sum, t) => sum + t.profitPercent,
        0
      );
      const winRate =
        strategyTrades.length > 0
          ? (strategyTrades.filter((t) => t.profitPercent > 0).length /
              strategyTrades.length) *
            100
          : 0;

      return {
        strategyName: r.strategyName,
        totalReturn: Number.parseFloat(totalReturn.toFixed(2)),
        winRate: Number.parseFloat(winRate.toFixed(2)),
        tradeCount: strategyTrades.length,
        profit: ((totalReturn / 100) * amount).toFixed(2),
      };
    });

    // Set cache control headers to prevent caching
    const headers = new Headers();
    headers.append(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    headers.append("Pragma", "no-cache");
    headers.append("Expires", "0");

    // Return the backtest results
    return new NextResponse(
      JSON.stringify({
        summary, // Performance summary for each strategy
        prices, // Historical price data
        trades: allTrades, // All trades generated by the strategies
        direction, // The direction used for the backtest
      }),
      {
        status: 200,
        headers: headers,
      }
    );
  } catch (err) {
    // Handle errors and return appropriate response
    const error = err instanceof Error ? err : new Error("Unknown error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
