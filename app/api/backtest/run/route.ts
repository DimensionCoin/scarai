// api/backtest/run/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { strategyRegistry } from "@/lib/backtest/strategies";
import type { BacktestResult } from "@/lib/backtest/runBacktests";

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Read the request body as text first to debug
    const bodyText = await req.text();
    console.log("Raw request body:", bodyText);

    // Parse the body manually
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Extract parameters from the parsed body
    const {
      coin,
      amount,
      strategies,
      direction = "both", // Default to both if not provided
      leverage = 1,
    } = body;

    // Log the raw request body after parsing
    console.log("API received request body:", body);
    console.log("API parsed direction parameter:", direction);
    console.log(
      "API request headers:",
      Object.fromEntries(req.headers.entries())
    );

    if (!coin || !amount || !strategies?.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    // Enhanced debug logging to verify the direction parameter
    console.log(
      "API received request with direction:",
      direction,
      "and leverage:",
      leverage
    );
    console.log("Direction type:", typeof direction);
    console.log(
      "Is direction valid:",
      direction === "long" || direction === "short" || direction === "both"
    );

    const now = Math.floor(Date.now() / 1000);
    const from = now - 90 * 24 * 60 * 60;

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

    const data = await res.json();
    const prices = data.prices as number[][];

    const results: BacktestResult[] = [];

    for (const name of strategies) {
      const path = strategyRegistry[name];
      if (!path) continue;

      try {
        // Import the strategy directly by name instead of using dynamic path
        let stratFn;

        if (path === "macdCrossStrategy") {
          const { macdCrossStrategy } = await import(
            "@/lib/backtest/strategies/macdCrossStrategy"
          );
          stratFn = macdCrossStrategy;
        } else if (path === "rsiReversalStrategy") {
          const { rsiReversalStrategy } = await import(
            "@/lib/backtest/strategies/rsiReversalStrategy"
          );
          stratFn = rsiReversalStrategy;
        } else {
          console.warn(`Unknown strategy: ${name} (${path})`);
          continue;
        }

        if (stratFn) {
          // Explicitly pass the direction and leverage to the strategy
          console.log(
            `Running strategy ${name} with direction: "${direction}", leverage: ${leverage}`
          );

          const rawResult = stratFn(prices, {
            direction: direction,
            leverage: leverage,
          });

          if (!rawResult?.trades?.length) {
            console.warn(`⚠️ Strategy [${name}] produced no trades.`);
          }

          // Log the trade directions to verify filtering
          console.log(
            `Strategy ${name} returned trades with directions: ${rawResult.trades
              .map((t) => t.direction)
              .join(", ")}`
          );

          results.push(rawResult);
        }
      } catch (error) {
        console.error(`Error loading strategy ${name} (${path}):`, error);
      }
    }

    // Collect all trades from all strategies
    let allTrades = results.flatMap((r) =>
      r.trades.map((t) => ({
        ...t,
        strategy: r.strategyName,
        entryAction: t.entryAction,
        exitAction: t.exitAction,
        exitReason: t.exitReason,
      }))
    );

    // CRITICAL: Force filter trades to match the selected direction
    if (direction !== "both") {
      console.log(
        `CRITICAL FILTERING: Before ${allTrades.length} trades, direction=${direction}`
      );

      // Double-check that all trades match the selected direction
      allTrades = allTrades.filter((t) => t.direction === direction);

      console.log(
        `CRITICAL FILTERING: After ${allTrades.length} ${direction} trades`
      );
    }

    // Log all trade directions before returning
    console.log(
      `Final trades directions: ${allTrades.map((t) => t.direction).join(", ")}`
    );

    // Calculate summary based on the filtered trades
    const summary = results.map((r) => {
      // Filter trades for this strategy by direction (should already be filtered, but double-check)
      const strategyTrades = allTrades.filter(
        (t) => t.strategy === r.strategyName
      );

      // Recalculate metrics based on filtered trades
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

    // Add a response header to prevent caching
    const headers = new Headers();
    headers.append(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    headers.append("Pragma", "no-cache");
    headers.append("Expires", "0");

    // Add the direction to the response to ensure it's preserved
    return new NextResponse(
      JSON.stringify({
        summary,
        prices,
        trades: allTrades,
        direction, // Include the direction in the response
      }),
      {
        status: 200,
        headers: headers,
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("❌ Backtest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
