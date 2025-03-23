"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { coins } from "@/hooks/pyth/coin";
import { usePythPrices } from "@/hooks/pyth/usePythPrice";
import { X, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

// Helper function to format raw values to price format
const formatPrice = (raw: string, expo: number) => {
  const value = Number(raw) * Math.pow(10, expo);
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const CryptoPriceHero: React.FC = () => {
  const { userId } = useAuth();
  const [selectedCoinIds, setSelectedCoinIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // Extract feed IDs from the selected coins (only coins with non-empty IDs)
  const feedIds = selectedCoinIds.filter((id) => id.trim() !== "");
  const { prices, error } = usePythPrices(feedIds);

  // price green when up and red when down
  const [previousPrices, setPreviousPrices] = useState<{
    [key: string]: number;
  }>({});
  const [priceChangeDirection, setPriceChangeDirection] = useState<{
    [key: string]: "up" | "down" | "same";
  }>({});
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const newPrevious: { [key: string]: number } = { ...previousPrices };
    const newDirection: { [key: string]: "up" | "down" | "same" } = {
      ...priceChangeDirection,
    };

    Object.keys(prices).forEach((id) => {
      const current = prices[id];
      if (!current) return;

      const currentPrice = Number(current.price) * Math.pow(10, current.expo);
      const prev = previousPrices[id];

      if (prev === undefined) {
        newPrevious[id] = currentPrice;
        newDirection[id] = "same";
      } else if (currentPrice > prev) {
        newDirection[id] = "up";
      } else if (currentPrice < prev) {
        newDirection[id] = "down";
      } else {
        newDirection[id] = "same";
      }

      // Delay updating previousPrices to let the color show
      setTimeout(() => {
        setPreviousPrices((prev) => ({ ...prev, [id]: currentPrice }));
      }, 500);
    });

    setPriceChangeDirection(newDirection);
  }, [prices]);

  // On mount: fetch user's top 3 coins from the DB
  useEffect(() => {
    const fetchTopCoins = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/usercoins?clerkId=${userId}`);
        const data = await res.json();
        if (data.topCoins && data.topCoins.length === 3) {
          setSelectedCoinIds(data.topCoins);
        } else {
          // If not found or not exactly 3, use the default first three
          const defaultIds = coins.slice(0, 3).map((coin) => coin.id);
          setSelectedCoinIds(defaultIds);
        }
      } catch (error) {
        console.error("Error fetching user's top coins:", error);
        const defaultIds = coins.slice(0, 3).map((coin) => coin.id);
        setSelectedCoinIds(defaultIds);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopCoins();
  }, [userId]);

  // When modal opens, prefill temp selection with current selections
  useEffect(() => {
    if (isModalOpen) {
      setTempSelectedIds([...selectedCoinIds]);
      setSearchQuery("");
    }
  }, [isModalOpen, selectedCoinIds]);

  // Filter coins based on search query
  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle coin selection in modal
  const toggleCoinSelection = (coinId: string) => {
    if (tempSelectedIds.includes(coinId)) {
      setTempSelectedIds(tempSelectedIds.filter((id) => id !== coinId));
    } else {
      // Only allow selecting up to 3 coins
      if (tempSelectedIds.length < 3) {
        setTempSelectedIds([...tempSelectedIds, coinId]);
      }
    }
  };

  // Save selections: update the DB and update local state
  const saveSelections = async () => {
    if (!userId) return;
    try {
      await fetch("/api/usercoins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: userId, topCoins: tempSelectedIds }),
      });
      // Update local state with the selected coins
      setSelectedCoinIds(tempSelectedIds);
    } catch (error) {
      console.error("Error saving top coins:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  // Get the selected coin objects
  const selectedCoins = coins.filter((coin) =>
    selectedCoinIds.includes(coin.id)
  );

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-lg mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-indigo-500/5"></div>
        <div className="relative p-1.5 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-xs sm:text-sm font-medium text-zinc-300">
              Live Prices
            </h2>
            <Button
              variant="ghost"
              size="sm" // Changed from "icon" to "sm" for better text fit
              className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-teal-400 px-1.5" // Added padding
              onClick={() => setIsModalOpen(true)}
            >
              <p className="text-xs sm:text-sm">Change Top Coins</p>{" "}
              {/* Controlled text size */}
            </Button>
          </div>
          {isLoading ? (
            <p className="text-center text-sm text-zinc-400">Loading...</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 max-w-4xl mx-auto">
              {selectedCoins.map((coin) => {
                // Normalize coin ID for price lookup
                const normId = coin.id.startsWith("0x")
                  ? coin.id.slice(2).toLowerCase()
                  : coin.id.toLowerCase();
                const priceData = prices[normId];
                return (
                  <Link href={`/coin/${coin.name.toLowerCase()}`} key={coin.id}>
                    <div className="relative rounded-lg overflow-hidden aspect-[4/3] sm:aspect-[3/2] sm:max-h-[160px] md:max-h-[180px] border border-white/10 hover:border-white/20 transition-colors">
                      {/* Background */}
                      <div className="absolute inset-0 bg-black/40">
                        {coin.image && (
                          <div className="absolute inset-0 opacity-20">
                            <Image
                              src={coin.image || "/placeholder.svg"}
                              alt={coin.name}
                              fill
                              className="object-cover blur-[1px]"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/20 to-transparent"></div>
                      {/* Content */}
                      <div className="relative h-full flex flex-col justify-between p-2 sm:p-3">
                        <div className="flex justify-between items-start">
                          <div className="bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-300">
                            {coin.symbol.toUpperCase()}
                          </div>
                          <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                            {coin.image ? (
                              <Image
                                src={coin.image || "/placeholder.svg"}
                                alt={coin.name}
                                width={40}
                                height={40}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[8px]">
                                {coin.symbol.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <h3 className="text-xs sm:text-sm font-medium text-white truncate">
                            {coin.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1">
                            <p
                              className={`text-xs sm:text-sm font-semibold ${
                                priceChangeDirection[normId] === "up"
                                  ? "text-green-400"
                                  : priceChangeDirection[normId] === "down"
                                  ? "text-red-400"
                                  : "text-white"
                              }`}
                            >
                              {priceData ? (
                                `$${formatPrice(
                                  priceData.price,
                                  priceData.expo
                                )}`
                              ) : (
                                <span className="flex items-center">
                                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                                  <span className="truncate">Loading</span>
                                </span>
                              )}
                            </p>
                            {priceData && (
                              <span className="text-[8px] sm:text-[10px] text-zinc-400 mt-0.5 sm:mt-0">
                                ± {formatPrice(priceData.conf, priceData.expo)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
              Error fetching prices: {error.message}
            </div>
          )}
        </div>
      </div>

      {/* Coin Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-xl border border-white/15 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    Select Cryptocurrencies
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose up to 3 cryptocurrencies to display
                </p>
                {/* Search Input */}
                <div className="mt-3 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-black/30 border-white/10 text-zinc-200 placeholder-zinc-500 focus-visible:ring-teal-500/30"
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Selected:{" "}
                  <span className="text-teal-400 font-medium">
                    {tempSelectedIds.length}/3
                  </span>
                </div>
              </div>

              {/* Coin List */}
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredCoins.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    No cryptocurrencies found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredCoins.map((coin) => {
                    const isSelected = tempSelectedIds.includes(coin.id);
                    return (
                      <div
                        key={coin.id}
                        onClick={() => toggleCoinSelection(coin.id)}
                        className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-teal-500/10 border border-teal-500/30"
                            : "bg-blackl/40 border border-white/10 hover:bg-white/20 hover:border-black"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden mr-3">
                          {coin.image ? (
                            <Image
                              src={coin.image || "/placeholder.svg"}
                              alt={coin.name}
                              width={20}
                              height={20}
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[8px]">
                              {coin.symbol.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {coin.name}
                            </p>
                            <span className="text-xs text-zinc-500 ml-1">
                              {coin.symbol}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`ml-2 h-5 w-5 rounded-full flex items-center justify-center ${
                            isSelected
                              ? "bg-teal-500 text-white"
                              : "bg-white/10 text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-white/10 text-zinc-800 hover:bg-white/30 hover:text-black"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveSelections}
                  disabled={tempSelectedIds.length === 0}
                  className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white border-0"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CryptoPriceHero;
