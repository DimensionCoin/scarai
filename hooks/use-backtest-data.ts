"use client";

import { useState, useEffect } from "react";
import type { Trade, Summary } from "@/types/backtest";

export function useBacktestData() {
  const [amount, setAmount] = useState(1000);
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState<
    { id: string; name: string; symbol?: string; image?: string }[]
  >([]);
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [selectedCoinName, setSelectedCoinName] = useState<string>("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [tradeDirection, setTradeDirection] = useState<
    "long" | "short" | "both"
  >("both");
  const [leverage, setLeverage] = useState(1);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [prices, setPrices] = useState<number[][]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [playIndex, setPlayIndex] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [completedTrades, setCompletedTrades] = useState<Trade[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log direction changes
  useEffect(() => {
    console.log("Trade direction changed to:", tradeDirection);
  }, [tradeDirection]);

  // Calculate active trades - with safety checks
  const activeTrades = trades.filter(
    (t) =>
      t.entryIndex <= playIndex &&
      t.exitIndex > playIndex &&
      !completedTrades.includes(t)
  );

  // Calculate performance metrics - with safety checks
  const totalProfit = completedTrades.reduce(
    (sum, trade) => sum + trade.profitPercent,
    0
  );

  const winningTrades = completedTrades.filter((t) => t.profitPercent > 0);
  const winRate =
    completedTrades.length > 0
      ? (winningTrades.length / completedTrades.length) * 100
      : 0;

  // Current price and date - with safety checks
  const currentPrice = prices[playIndex]?.[1] ?? 0;
  const currentDate = prices[playIndex]
    ? new Date(prices[playIndex][0]).toLocaleDateString()
    : "";
  const currentTime = prices[playIndex]
    ? new Date(prices[playIndex][0]).toLocaleTimeString()
    : "";

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length > 1) {
        fetch(`/api/coinlist?query=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((data) => setCoins(data))
          .catch((err) => {
            console.error("Error fetching coin list:", err);
            setError("Failed to fetch coin list. Please try again.");
          });
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing && prices.length > 0) {
      interval = setInterval(() => {
        setPlayIndex((prev) => {
          const next = prev + 1;
          if (next >= prices.length) {
            setPlaying(false);
            return prev;
          }

          const newClosed = trades.filter(
            (t) => t.exitIndex === next && !completedTrades.includes(t)
          );

          if (newClosed.length > 0) {
            setCompletedTrades((prevTrades) => [...prevTrades, ...newClosed]);
          }

          return next;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [playing, prices, trades, completedTrades, playbackSpeed]);

  // Modify the runBacktest function to accept an explicit direction parameter
  const runBacktest = async (
    coinId?: string,
    strategies?: string[],
    direction?: "long" | "short" | "both"
  ) => {
    // Use passed parameters or fall back to state values
    const coinToUse = coinId || selectedCoin || query.trim();
    const strategiesToUse = strategies || selectedStrategies;

    // CRITICAL: Use the explicitly passed direction or fall back to the state
    // This ensures we're using the most up-to-date direction value
    const directionToUse = direction || tradeDirection;

    console.log("Inside runBacktest function with params:", {
      coinId: coinToUse,
      strategiesCount: strategiesToUse.length,
      isRequestPending,
      direction: directionToUse, // Log the direction explicitly
    });

    if (!coinToUse || strategiesToUse.length === 0 || isRequestPending) {
      console.error("Cannot run backtest:", {
        selectedCoin: coinToUse,
        strategiesCount: strategiesToUse.length,
        isRequestPending,
      });
      setError(
        "Cannot run backtest: Please enter a coin name and select at least one strategy."
      );
      return;
    }

    setIsLoading(true);
    setIsRequestPending(true);
    setError(null);

    // Reset state to avoid stale data
    setPrices([]);
    setTrades([]);
    setSummary([]);
    setCompletedTrades([]);
    setPlayIndex(0);

    try {
      // Log the exact parameters being sent to the API
      console.log("Running backtest with EXACT params:", {
        coin: coinToUse,
        amount,
        strategies: strategiesToUse,
        direction: directionToUse, // Use the explicit direction
        leverage,
      });

      // Add a cache-busting parameter to prevent caching issues
      const timestamp = Date.now();

      // Create the request body object explicitly to ensure direction is set correctly
      const requestBody = {
        coin: coinToUse,
        amount,
        strategies: strategiesToUse,
        direction: directionToUse, // Use the explicit direction
        leverage,
      };

      console.log("REQUEST BODY STRINGIFIED:", JSON.stringify(requestBody));

      const res = await fetch(`/api/backtest/run?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Direction": directionToUse, // Add direction as a custom header as well
        },
        body: JSON.stringify(requestBody),
        cache: "no-store", // Prevent caching
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        throw new Error(`API Error (${res.status}): ${errorText}`);
      }

      const data = await res.json();

      // Make sure we're handling the API response correctly
      if (data.error) {
        console.error("API Error:", data.error);
        setError(`API Error: ${data.error}`);
        return;
      }

      console.log("Backtest results:", data);
      console.log(
        "Trade directions:",
        data.trades.map((t: Trade) => t.direction)
      );

      // Initialize with empty arrays if data is missing
      setSummary(data.summary || []);
      setPrices(data.prices || []);
      setTrades(data.trades || []);
      setCompletedTrades([]);
      setPlayIndex(0);
    } catch (error) {
      console.error("Error running backtest:", error);
      setError(
        `Error running backtest: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
      setIsRequestPending(false);
    }
  };

  const jumpToStart = () => {
    setPlayIndex(0);
    setCompletedTrades([]);
  };

  const jumpToEnd = () => {
    if (prices.length === 0) return;

    setPlayIndex(prices.length - 1);
    // Calculate all completed trades
    const allCompletedTrades = trades.filter(
      (t) => t.exitIndex <= prices.length - 1
    );
    setCompletedTrades(allCompletedTrades);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return {
    // State
    amount,
    setAmount,
    query,
    setQuery,
    coins,
    setCoins,
    selectedCoin,
    setSelectedCoin,
    selectedCoinName,
    setSelectedCoinName,
    selectedStrategies,
    setSelectedStrategies,
    tradeDirection,
    setTradeDirection,
    leverage,
    setLeverage,
    summary,
    prices,
    trades,
    playIndex,
    setPlayIndex,
    playing,
    setPlaying,
    completedTrades,
    activeTrades,
    playbackSpeed,
    setPlaybackSpeed,
    isLoading,
    error,
    setError,

    // Derived values
    currentPrice,
    currentDate,
    currentTime,
    totalProfit,
    winRate,

    // Functions
    runBacktest,
    jumpToStart,
    jumpToEnd,
    formatCurrency,
  };
}
