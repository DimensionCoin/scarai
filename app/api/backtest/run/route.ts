import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { strategyRegistry } from "@/lib/backtest/strategies";
import { BacktestResult } from "@/lib/backtest/runBacktests";

const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

export async function POST(req: NextRequest) {
  try {
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
    } = await req.json();

    if (!coin || !amount || !strategies?.length) {
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

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

      const mod = await import(`@/lib/backtest/strategies/${path}`);
      const stratFn = Object.values(mod).find(
        (
          f
        ): f is (
          p: number[][],
          c: { direction: "long" | "short" | "both"; leverage: number }
        ) => BacktestResult => typeof f === "function"
      );

      if (stratFn) {
        const rawResult = stratFn(prices, { direction, leverage });

        if (!rawResult?.trades?.length) {
          console.warn(`⚠️ Strategy [${name}] produced no trades.`);
        }

        results.push({
          strategyName: rawResult.strategyName,
          trades: rawResult.trades,
          totalReturn: parseFloat(rawResult.totalReturn.toFixed(2)),
          winRate: parseFloat(rawResult.winRate.toFixed(2)),
        });
      }
    }

    return NextResponse.json({
      summary: results.map((r) => ({
        strategyName: r.strategyName,
        totalReturn: r.totalReturn,
        winRate: r.winRate,
        tradeCount: r.trades.length,
        profit: ((r.totalReturn / 100) * amount).toFixed(2),
      })),
      prices,
      trades: results.flatMap((r) =>
        r.trades.map((t) => ({ ...t, strategy: r.strategyName }))
      ),
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("❌ Backtest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
