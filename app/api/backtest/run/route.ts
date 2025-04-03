import { type NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { macdCrossStrategy } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "@/lib/backtest/strategies/rsiReversalStrategy";

import {
  hasEnoughCredits,
  deductCredits,
  logCreditUsage,
} from "@/actions/user.actions";

const strategyRegistry = {
  "MACD Cross Strategy": "macdCrossStrategy",
  "RSI Reversal Strategy": "rsiReversalStrategy",
};

const strategyFunctions = {
  macdCrossStrategy,
  rsiReversalStrategy,
};

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in query params" },
        { status: 400 }
      );
    }

    const hasCredits = await hasEnoughCredits(userId, 1);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      coin,
      amount: initialAmount,
      strategies = [],
      direction = "both",
      leverage: initialLeverage = 1,
    } = body;

    if (!coin || !strategies.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    let amount =
      typeof initialAmount === "string"
        ? parseFloat(initialAmount)
        : initialAmount;
    if (isNaN(amount) || amount <= 0) amount = 1000;

    let leverage = initialLeverage;
    if (isNaN(leverage) || leverage < 1) leverage = 1;

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
      const errorText = await res.text();
      throw new Error(`CoinGecko error: ${res.status} — ${errorText}`);
    }

    const data = await res.json();
    const prices = data.prices as number[][];
    const results = [];

    for (const strategyName of strategies) {
      const path =
        strategyRegistry[strategyName as keyof typeof strategyRegistry];
      const strategyFn =
        strategyFunctions[path as keyof typeof strategyFunctions];
      if (typeof strategyFn !== "function") continue;

      const result = strategyFn(prices, { direction, leverage, amount });
      results.push(result);
    }

    let allTrades = results.flatMap((r) =>
      r.trades.map((t) => ({ ...t, strategy: r.strategyName }))
    );

    if (direction !== "both") {
      allTrades = allTrades.filter((t) => t.direction === direction);
    }

    const summary = results.map((r) => {
      const trades = allTrades.filter((t) => t.strategy === r.strategyName);
      const totalProfitAmount = trades.reduce(
        (sum, t) => sum + (t.profitAmount || 0),
        0
      );
      const spotProfitAmount = trades.reduce(
        (sum, t) => sum + (t.spotProfitAmount || 0),
        0
      );
      const winRate =
        trades.length > 0
          ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) *
            100
          : 0;

      return {
        strategyName: r.strategyName,
        totalReturn: parseFloat(
          ((totalProfitAmount / amount) * 100).toFixed(2)
        ),
        spotReturn: parseFloat(((spotProfitAmount / amount) * 100).toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        tradeCount: trades.length,
        profit: totalProfitAmount.toFixed(2),
        spotProfit: spotProfitAmount.toFixed(2),
        leverageUsed: leverage,
      };
    });

    // ✅ Deduct 1 credit and log usage
    await deductCredits(userId, 1);
    await logCreditUsage({
      userId,
      type: "coin", // Reuse "coin" type unless you expand it
      coin,
      message: `Ran backtest with ${strategies.join(", ")}`,
      creditsUsed: 1,
    });

    return NextResponse.json({
      summary,
      prices,
      trades: allTrades,
      direction,
      amount,
      leverage,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("❌ Backtest error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
