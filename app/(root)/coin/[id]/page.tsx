"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  BarChart2,
  LinkIcon,
  Code,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/providers/UserProvider";
import TradingViewWidget from "@/components/coin/TradingViewWidget";
import TradingSuggestion from "@/components/coin/TradingSuggestion";
import ChartWidget from "@/components/coin/ChartWidget";

interface Ticker {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
    has_trading_incentive: boolean;
  };
  // ... any other fields you need
}

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  image: { large: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
  };
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  platforms: Record<string, string>;
  detail_platforms?: Record<
    string,
    { contract_address: string; decimal_place?: number }
  >;
  selectedTicker?: Ticker; // New property from your API
}

export default function CoinPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const hasFetched = useRef(false); // Tracks if fetch has occurred
  const fetchLock = useRef(false); // Prevents concurrent fetches  const { refreshUser } = useUserContext();
  const { refreshUser } = useUserContext();
  const params = useParams() as { id: string };
  const coinId = params.id;

  useEffect(() => {
    if (
      !isLoaded ||
      !user?.id ||
      !coinId ||
      hasFetched.current ||
      fetchLock.current
    )
      return;

    const fetchCoinData = async () => {
      fetchLock.current = true; // Lock to prevent concurrent calls
      setIsLoading(true);
      try {
        console.log(`Fetching coin data for ${coinId}`);
        const response = await fetch(
          `/api/fetchcoin?coinId=${coinId}&userId=${user.id}`
        );
        const result = await response.json();

        if (!response.ok)
          throw new Error(result.error || "Failed to fetch coin data");

        setCoin(result.coin);
        hasFetched.current = true; // Mark as fetched only on success
        await refreshUser(); // Update user credits
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error fetching coin data:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        fetchLock.current = false; // Unlock after completion
      }
    };

    fetchCoinData();

    // Cleanup not needed since we’re not using timeouts or subscriptions
  }, [coinId, isLoaded, user?.id]); // Stable dependencies

  // Build TradingView symbol using selectedTicker if available
  let tradingViewSymbol: string;

  if (coin?.selectedTicker) {
    let marketId = coin.selectedTicker.market.identifier.toLowerCase();
    const symbol = coin.symbol.toUpperCase();

    // Replace "qurbit", "monkyc_io", or "mxc" with "mexc"
    if (
      marketId === "qurbit" ||
      marketId === "monkyc_io" ||
      marketId === "mxc"
    ) {
      marketId = "mexc";
    }

    if (marketId === "binance") {
      tradingViewSymbol = `BINANCE:${symbol}USDT`;
    } else if (marketId === "gate") {
      tradingViewSymbol = `GATEIO:${symbol}USDT`;
    } else if (marketId === "gdax") {
      tradingViewSymbol = `BYBIT:${symbol}USDT`;
    } else {
      tradingViewSymbol = `${marketId.toUpperCase()}:${symbol}${coin.selectedTicker.target.toUpperCase()}`;
    }
  } else {
    tradingViewSymbol = `${coin?.symbol.toUpperCase()}USD`;
  }

  const formatPrice = (price: number) => {
    if (price < 1) {
      return price.toFixed(6);
    }
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(2)}T`;
    }
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    return `$${num.toLocaleString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    });
  };

  // Format network name for better display
  const formatNetworkName = (network: string) => {
    // Replace hyphens and underscores with spaces
    const formatted = network.replace(/[-_]/g, " ");
    // Capitalize each word
    return formatted
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get contract addresses from either platforms or detail_platforms
  const getContractAddresses = (coin: CoinData) => {
    const addresses: { network: string; address: string }[] = [];

    // Check platforms object
    if (coin.platforms) {
      Object.entries(coin.platforms).forEach(([network, address]) => {
        if (address && address.trim() !== "") {
          addresses.push({ network, address });
        }
      });
    }

    // Check detail_platforms object
    if (coin.detail_platforms) {
      Object.entries(coin.detail_platforms).forEach(([network, details]) => {
        if (
          details.contract_address &&
          details.contract_address.trim() !== ""
        ) {
          // Only add if not already added from platforms
          if (
            !addresses.some(
              (item) =>
                item.network === network &&
                item.address === details.contract_address
            )
          ) {
            addresses.push({ network, address: details.contract_address });
          }
        }
      });
    }

    return addresses;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-8 mb-14 relative z-10">
          <motion.div
            className="flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-teal-400 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </motion.div>

          {/* Coin Header Skeleton */}
          <motion.div
            className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 opacity-30 blur animate-pulse"></div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/30 backdrop-blur-md border border-white/10 relative"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-48 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-24 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="md:ml-auto flex flex-col items-start md:items-end space-y-2">
              <div className="h-8 w-32 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
              <div className="h-4 w-20 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
            </div>
          </motion.div>

          {/* Chart Skeleton */}
          <motion.div
            className="mb-8 relative overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="h-64 w-full p-4">
                <div className="h-8 w-48 bg-black/30 backdrop-blur-md rounded-lg mb-4 animate-pulse"></div>
                <div className="flex items-end justify-between h-40 w-full px-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-teal-500/20 backdrop-blur-md rounded-t-md animate-pulse"
                      style={{
                        width: "4%",
                        height: `${20 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>

          {/* Stats and Links Skeletons */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Market Stats Skeleton */}
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
                <div className="border-b border-white/10 p-4">
                  <div className="h-6 w-32 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                </div>
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 border-b border-zinc-800/30"
                    >
                      <div className="h-4 w-24 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                      <div className="h-4 w-20 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
            </div>

            {/* Links Skeleton */}
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
                <div className="border-b border-white/10 p-4">
                  <div className="h-6 w-32 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                </div>
                <div className="p-4 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 border-b border-zinc-800/30"
                    >
                      <div className="h-4 w-24 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                      <div className="h-4 w-16 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
            </div>
          </motion.div>

          {/* Contract Addresses Skeleton */}
          <motion.div
            className="mb-8 relative overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <div className="h-6 w-48 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
              </div>
              <div className="p-4 space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 pb-4 border-b border-zinc-800/30"
                  >
                    <div className="h-4 w-24 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                    <div className="flex-grow h-8 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>

          {/* About Skeleton */}
          <motion.div
            className="relative overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <div className="h-6 w-40 bg-black/30 backdrop-blur-md rounded-lg animate-pulse"></div>
              </div>
              <div className="p-4 space-y-4">
                <div className="h-4 w-full bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-full bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-3/4 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-full bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-5/6 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-full bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
                <div className="h-4 w-2/3 bg-black/20 backdrop-blur-md rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-2 mb-14 relative z-10">
          <motion.div
            className="flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-teal-400 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl max-w-md mx-auto"
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-rose-500/20 blur-lg"></div>
                  <ArrowLeft className="h-12 w-12 text-rose-400 relative" />
                </div>
                <h2 className="text-xl text-rose-400 mb-4">Error</h2>
                <p className="text-zinc-300 text-center">{error}</p>
                <Button
                  className="mt-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-0"
                  onClick={() => router.push("/dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-red-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!coin) {
    return null;
  }

  const priceChange = coin.market_data.price_change_percentage_24h;
  const isPositive = priceChange >= 0;
  const contractAddresses = getContractAddresses(coin);

  return (
    <div className="min-h-screen text-white">
      <motion.div
        className="container mx-auto md:px-4 py-2 mb-14 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex justify-between w-full"
          variants={itemVariants}
        >
          <div className="flex items-center mb-6 gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-teal-400 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <ChartWidget symbol={tradingViewSymbol} />
          </div>
          <div></div>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-30 blur"></div>
              <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                <Image
                  src={coin.image.large || "/placeholder.svg"}
                  alt={coin.name}
                  height={60}
                  width={60}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
                {coin.name}
              </h1>
              <p className="text-zinc-400 uppercase">{coin.symbol}</p>
            </div>
          </div>
          <div className="md:ml-auto flex flex-col items-start md:items-end">
            <div className="text-2xl md:text-3xl font-bold text-white">
              ${formatPrice(coin.market_data.current_price.usd)}
            </div>
            <div
              className={`flex items-center ${
                isPositive ? "text-teal-400" : "text-rose-500"
              }`}
            >
              {isPositive ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(priceChange).toFixed(2)}% (24h)
            </div>
          </div>
        </motion.div>
        <div className="w-full h-[220px] relative overflow-hidden rounded-xl backdrop-blur-xl mb-4">
          <TradingViewWidget symbol={tradingViewSymbol} />
        </div>
        <div className="mt-2 mb-4">
          <TradingSuggestion symbol={coin.id} />
        </div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          variants={itemVariants}
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-zinc-100 flex items-center gap-2 font-medium">
                  <BarChart2 className="h-4 w-4 text-teal-400" />
                  Market Stats
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                    <span className="text-zinc-400">Market Cap</span>
                    <span className="text-zinc-100 font-medium">
                      {formatLargeNumber(coin.market_data.market_cap.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                    <span className="text-zinc-400">24h Trading Volume</span>
                    <span className="text-zinc-100 font-medium">
                      {formatLargeNumber(coin.market_data.total_volume.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                    <span className="text-zinc-400">24h High</span>
                    <span className="text-zinc-100 font-medium">
                      ${formatPrice(coin.market_data.high_24h.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                    <span className="text-zinc-400">24h Low</span>
                    <span className="text-zinc-100 font-medium">
                      ${formatPrice(coin.market_data.low_24h.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                    <span className="text-zinc-400">Circulating Supply</span>
                    <span className="text-zinc-100 font-medium">
                      {coin.market_data.circulating_supply.toLocaleString()}{" "}
                      {coin.symbol.toUpperCase()}
                    </span>
                  </div>
                  {coin.market_data.max_supply && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-zinc-400">Max Supply</span>
                      <span className="text-zinc-100 font-medium">
                        {coin.market_data.max_supply.toLocaleString()}{" "}
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-zinc-100 flex items-center gap-2 font-medium">
                  <LinkIcon className="h-4 w-4 text-teal-400" />
                  Links
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {coin.links.homepage[0] && (
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/30 group">
                      <span className="text-zinc-400">Website</span>
                      <a
                        href={coin.links.homepage[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        Visit <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {coin.links.blockchain_site[0] && (
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/30 group">
                      <span className="text-zinc-400">Explorer</span>
                      <a
                        href={coin.links.blockchain_site[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {coin.links.subreddit_url && (
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/30 group">
                      <span className="text-zinc-400">Reddit</span>
                      <a
                        href={coin.links.subreddit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {coin.links.repos_url.github[0] && (
                    <div className="flex justify-between items-center py-2 group">
                      <span className="text-zinc-400">GitHub</span>
                      <a
                        href={coin.links.repos_url.github[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center group-hover:translate-x-1 transition-transform"
                      >
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>
        </motion.div>

        {/* Contract Addresses Section */}
        {contractAddresses.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="mb-8 relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-zinc-100 flex items-center gap-2 font-medium">
                  <Code className="h-4 w-4 text-teal-400" />
                  Contract Addresses
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {contractAddresses.map(({ network, address }, index) => (
                    <motion.div
                      key={`${network}-${address}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 pb-4 border-b border-zinc-800/30 last:border-0 last:pb-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-zinc-400 font-medium flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-teal-400"></div>
                          {formatNetworkName(network)}
                        </span>
                      </div>
                      <div className="flex-grow flex items-center gap-2 overflow-hidden">
                        <code className="text-zinc-300 text-sm bg-black/30 backdrop-blur-md px-2 py-1 rounded overflow-x-auto max-w-full whitespace-nowrap border border-white/10">
                          {address}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-teal-400 hover:bg-black/30 transition-colors"
                          onClick={() => copyToClipboard(address)}
                          title={
                            copiedAddress === address
                              ? "Copied!"
                              : "Copy to clipboard"
                          }
                        >
                          {copiedAddress === address ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {copiedAddress === address
                              ? "Copied!"
                              : "Copy to clipboard"}
                          </span>
                        </Button>
                        {coin.links.blockchain_site[0] && (
                          <a
                            href={`${coin.links.blockchain_site[0]}/token/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-teal-400 transition-colors"
                            title="View on blockchain explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">
                              View on blockchain explorer
                            </span>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>
        )}

        {coin.description.en && (
          <motion.div
            variants={itemVariants}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-zinc-100 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-teal-400" />
                  About {coin.name}
                </h3>
              </div>
              <div className="p-4">
                <div
                  className="text-zinc-300 prose prose-invert max-w-none prose-a:text-teal-400 prose-a:no-underline hover:prose-a:text-teal-300 prose-headings:text-zinc-100 prose-strong:text-zinc-200 prose-code:bg-black/30 prose-code:text-teal-300 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
                  dangerouslySetInnerHTML={{ __html: coin.description.en }}
                />
              </div>
            </div>
            <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
