"use client";

import { useState, useEffect, useRef } from "react";
import type { Trade, Summary } from "@/types/backtest";
import { useUserContext } from "@/providers/UserProvider";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";


export function useBacktestData() {
  const [amount, setAmount] = useState(1000);
  const amountRef = useRef(1000); // Add a ref to track the current amount
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
  const leverageRef = useRef(1); // Add a ref to track the current leverage
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
  const userId = user?.id;

  // Update the ref whenever amount changes
  useEffect(() => {
    console.log("Amount changed to:", amount);
    amountRef.current = amount;
  }, [amount]);

  // Update the ref whenever leverage changes
  useEffect(() => {
    console.log("Leverage changed to:", leverage);
    leverageRef.current = leverage;
  }, [leverage]);

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

  // Custom setAmount function that updates both state and ref
  const setAmountWithRef = (newAmount: number) => {
    console.log(`Setting amount to: $${newAmount} (previous: $${amount})`);
    setAmount(newAmount);
    amountRef.current = newAmount;
  };

  // Custom setLeverage function that updates both state and ref
  const setLeverageWithRef = (newLeverage: number) => {
    console.log(
      `Setting leverage to: ${newLeverage}x (previous: ${leverage}x)`
    );
    setLeverage(newLeverage);
    leverageRef.current = newLeverage;
  };

  const runBacktest = async (
    coinId?: string,
    strategies?: string[],
    direction?: "long" | "short" | "both"
  ) => {
    const coinToUse = coinId || selectedCoin || query.trim();
    const strategiesToUse = strategies || selectedStrategies;
    const directionToUse = direction || tradeDirection;
    // Use the ref values to ensure we have the latest values
    const currentAmount = amountRef.current;
    const currentLeverage = leverageRef.current;

    if (!coinToUse || strategiesToUse.length === 0 || isRequestPending) {
      setError("Please enter a coin and select at least one strategy.");
      return;
    }

    if (!userId) {
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

      // Log the current values being sent to the API
      console.log(`Sending request with amount: $${currentAmount}`);
      console.log(`Sending request with leverage: ${currentLeverage}x`);

      const requestBody = {
        coin: coinToUse,
        amount: currentAmount,
        strategies: strategiesToUse,
        direction: directionToUse,
        leverage: currentLeverage,
      };


      const res = await fetch(
        `/api/backtest/run?userId=${encodeURIComponent(userId)}&t=${timestamp}`,
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

      // Log the values received back from the API
      console.log(`API returned amount: $${data.amount}`);
      console.log(`API returned leverage: ${data.leverage}x`);

      // Ensure we don't reset the values
      if (data.amount && data.amount !== currentAmount) {
        console.log(
          `API returned different amount (${data.amount}) than sent (${currentAmount}), keeping original`
        );
      }

      if (data.leverage && data.leverage !== currentLeverage) {
        console.log(
          `API returned different leverage (${data.leverage}) than sent (${currentLeverage}), keeping original`
        );
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
    setAmount: setAmountWithRef, // Use our custom function
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
    setLeverage: setLeverageWithRef, // Use our custom function
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
