import { type NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { strategyRegistry } from "@/lib/backtest/strategies";
import type { BacktestResult } from "@/lib/backtest/runBacktests";
import { macdCrossStrategy } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "@/lib/backtest/strategies/rsiReversalStrategy";
import {
  hasEnoughCredits,
  deductCredits,
} from "@/actions/user.actions";


// Local strategy function map
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

    const body = await req.json();

    const {
      coin,
      amount,
      strategies,
      direction = "both",
      leverage = 1,
    }: {
      coin: string;
      amount: number;
      strategies: string[];
      direction: "long" | "short" | "both";
      leverage: number;
    } = body;

    if (!coin || !amount || !strategies?.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    // === CREDIT CHECK ===
    const hasCredits = await hasEnoughCredits(userId, 1);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 }
      );
    }

    // === FETCH HISTORICAL PRICE DATA ===
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

    await Promise.all(
      strategies.map(async (strategyName) => {
        const path = strategyRegistry[strategyName];
        const strategyFn =
          strategyFunctions[path as keyof typeof strategyFunctions];

        if (typeof strategyFn !== "function") {
          console.warn(`❌ Strategy not found: ${strategyName}`);
          return;
        }

        const result = strategyFn(prices, { direction, leverage });

        if (!result?.trades?.length) {
          console.warn(`⚠️ No trades for strategy: ${strategyName}`);
        }

        results.push(result);
      })
    );

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
      const totalReturn = trades.reduce((sum, t) => sum + t.profitPercent, 0);
      const winRate =
        trades.length > 0
          ? (trades.filter((t) => t.profitPercent > 0).length / trades.length) *
            100
          : 0;

      return {
        strategyName: r.strategyName,
        totalReturn: Number.parseFloat(totalReturn.toFixed(2)),
        winRate: Number.parseFloat(winRate.toFixed(2)),
        tradeCount: trades.length,
        profit: ((totalReturn / 100) * amount).toFixed(2),
      };
    });

    // === CREDIT DEDUCTION + LOG ===
    await deductCredits(userId, 1, {
      type: "backtest",
      coin,
      message: `Backtest using ${strategies.join(", ")}`,
    });


    return NextResponse.json({
      summary,
      prices,
      trades: allTrades,
      direction,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("❌ Backtest error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
