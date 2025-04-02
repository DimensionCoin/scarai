"use client";

import { useState, useEffect } from "react";
import type { Trade, Summary } from "@/types/backtest";
import { useUserContext } from "@/providers/UserProvider";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const { refreshUser } = useUserContext();
  const { user } = useUser();
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

  const runBacktest = async (
    coinId?: string,
    strategies?: string[],
    direction?: "long" | "short" | "both"
  ) => {
    const coinToUse = coinId || selectedCoin || query.trim();
    const strategiesToUse = strategies || selectedStrategies;
    const directionToUse = direction || tradeDirection;

    if (!coinToUse || strategiesToUse.length === 0 || isRequestPending) {
      setError("Please enter a coin and select at least one strategy.");
      return;
    }

    if (!user?.id) {
      setError("User not authenticated.");
      return;
    }

    setIsLoading(true);
    setIsRequestPending(true);
    setError(null);

    setPrices([]);
    setTrades([]);
    setSummary([]);
    setCompletedTrades([]);
    setPlayIndex(0);

    try {
      const timestamp = Date.now();
      const requestBody = {
        coin: coinToUse,
        amount,
        strategies: strategiesToUse,
        direction: directionToUse,
        leverage,
      };

      const res = await fetch(
        `/api/backtest/run?userId=${encodeURIComponent(
          user.id
        )}&t=${timestamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
      }

      const data = await res.json();

      if (data.error) {
        setError(`API Error: ${data.error}`);
        return;
      }

      setSummary(data.summary || []);
      setPrices(data.prices || []);
      setTrades(data.trades || []);
      setCompletedTrades([]);
      setPlayIndex(0);

      refreshUser(); // ✅ Refresh credits in UI after usage
    } catch (error) {
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
