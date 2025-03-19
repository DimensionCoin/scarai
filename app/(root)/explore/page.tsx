"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Grid3X3, List, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Exchange {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: string;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
}

interface ExchangeData {
  data: Exchange[];
}

export default function ExchangePage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [filteredExchanges, setFilteredExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(
    null
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch all exchanges once on component mount
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/exchange`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`Failed to fetch exchanges: ${res.status}`);
        }

        const { data }: ExchangeData = await res.json();
        setExchanges(data);
        setFilteredExchanges(data);
      } catch (error) {
        console.error("❌ Error fetching exchanges from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (exchanges.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setFilteredExchanges(exchanges);
      } else {
        const term = searchTerm.toLowerCase();
        const results = exchanges.filter(
          (exchange) =>
            exchange.name.toLowerCase().includes(term) ||
            exchange.description?.toLowerCase().includes(term)
        );
        setFilteredExchanges(results);
      }
      setIsSearching(false);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm, exchanges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to clear search or close modal
      if (e.key === "Escape") {
        if (selectedExchange) {
          setSelectedExchange(null);
        } else if (document.activeElement === searchInputRef.current) {
          setSearchTerm("");
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedExchange]);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedExchange(null);
      }
    };

    if (selectedExchange) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedExchange]);

  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const handleExchangeClick = (exchange: Exchange) => {
    setSelectedExchange(exchange);
  };

  // Function to render trust score badge
  const renderTrustScore = (score: number | null) => {
    if (score === null) return null;

    let colorClass = "bg-red-500/20 text-red-400";
    if (score >= 8) {
      colorClass = "bg-green-500/20 text-green-400";
    } else if (score >= 6) {
      colorClass = "bg-yellow-500/20 text-yellow-400";
    } else if (score >= 4) {
      colorClass = "bg-orange-500/20 text-orange-400";
    }

    return (
      <div className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>
        Trust: {score}/10
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        {/* Background elements */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-zinc-900 to-zinc-950 opacity-80"></div>
        </div>

        <div className="container mx-auto p-4 relative z-10 flex flex-col items-center justify-center min-h-screen">
          <div className="relative h-16 w-16 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 blur-md"></div>
            <div className="relative h-16 w-16 rounded-full border-4 border-t-transparent border-teal-400/50 animate-spin"></div>
          </div>
          <p className="text-base text-zinc-400">Loading exchanges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-zinc-900 to-zinc-950 opacity-80"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-500 mb-2">
            Explore Crypto Exchanges
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Discover and explore cryptocurrency exchanges from around the world.
          </p>
        </div>

        {/* Search and layout selector */}
        <div className="mb-6 sticky top-0 z-20 pt-2 pb-4 backdrop-blur-md bg-black/10">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Search input with glass effect */}
            <div className="relative flex-1 w-full">
              <div className="relative flex items-center border border-white/15 bg-black/10 backdrop-blur-xl rounded-lg overflow-hidden">
                <div className="flex items-center pl-3 text-zinc-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exchanges by name or description... (Ctrl+K)"
                  className="w-full bg-transparent py-2 px-3 text-base text-zinc-100 placeholder-zinc-500 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="pr-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* View layout selector */}
            <div className="flex rounded-lg overflow-hidden border border-white/15 h-10">
              <button
                onClick={() => setLayout("grid")}
                className={`px-3 py-2 flex items-center ${
                  layout === "grid"
                    ? "bg-white/10 text-teal-400"
                    : "bg-black/20 text-zinc-400 hover:text-zinc-200"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`px-3 py-2 flex items-center ${
                  layout === "list"
                    ? "bg-white/10 text-teal-400"
                    : "bg-black/20 text-zinc-400 hover:text-zinc-200"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search keyboard shortcut hint */}
          <div className="mt-2 text-xs text-zinc-500">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-black/30 border border-white/10 rounded text-zinc-400 font-mono">
              Ctrl+K
            </kbd>{" "}
            to search,{" "}
            <kbd className="px-1.5 py-0.5 bg-black/30 border border-white/10 rounded text-zinc-400 font-mono">
              Esc
            </kbd>{" "}
            to clear
          </div>
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center mb-4">
          <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
            <p className="text-xs text-zinc-400">
              {isSearching ? (
                <span className="flex items-center">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Searching...
                </span>
              ) : searchTerm ? (
                <span>
                  Found{" "}
                  <span className="text-teal-400 font-medium">
                    {filteredExchanges.length}
                  </span>{" "}
                  {filteredExchanges.length === 1 ? "exchange" : "exchanges"}{" "}
                  matching &quot;{searchTerm}&quot;
                </span>
              ) : (
                <span>
                  Showing all{" "}
                  <span className="text-teal-400 font-medium">
                    {filteredExchanges.length}
                  </span>{" "}
                  exchanges
                </span>
              )}
            </p>
          </div>
        </div>

        <div
          ref={containerRef}
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 240px)" }}
        >
          {filteredExchanges.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-medium text-zinc-300 mb-2">
                No exchanges found
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mb-6">
                {searchTerm
                  ? `We couldn't find any exchanges matching "${searchTerm}"`
                  : "No exchanges are currently available"}
              </p>

              {searchTerm && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="bg-black/20 backdrop-blur-xl border-white/15 hover:bg-white/10 text-zinc-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Search
                </Button>
              )}
            </div>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  onClick={() => handleExchangeClick(exchange)}
                  className="cursor-pointer"
                >
                  <div className="relative h-full rounded-xl overflow-hidden border border-white/10 hover:border-teal-500/30 transition-all duration-300 group">
                    {/* Background with logo */}
                    <div className="absolute inset-0 bg-zinc-900/90">
                      {exchange.image && (
                        <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300">
                          <Image
                            src={
                              exchange.image ||
                              "/placeholder.svg?height=100&width=100"
                            }
                            alt=""
                            fill
                            className="object-cover blur-[1px] group-hover:blur-0 transition-all duration-500 scale-110"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col p-4">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-teal-400/30 transition-all">
                          {exchange.image ? (
                            <Image
                              src={
                                exchange.image ||
                                "/placeholder.svg?height=24&width=24"
                              }
                              alt={exchange.name}
                              width={24}
                              height={24}
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                              {exchange.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {exchange.trust_score !== null &&
                          renderTrustScore(exchange.trust_score)}
                      </div>

                      <div className="mt-4">
                        <h3 className="text-lg font-medium text-white group-hover:text-teal-400 transition-colors mb-1">
                          {exchange.name}
                        </h3>
                        {exchange.trust_score_rank && (
                          <div className="text-xs text-zinc-400 mb-2">
                            Rank: #{exchange.trust_score_rank}
                          </div>
                        )}
                        <p className="text-xs text-zinc-500 line-clamp-3">
                          {exchange.description || "No description available"}
                        </p>
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="text-xs text-zinc-400">
                          24h Volume: {exchange.trade_volume_24h_btc.toFixed(2)}{" "}
                          BTC
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-xl">
              <div className="bg-black/40 text-zinc-400 text-xs grid grid-cols-12 gap-2 p-3 border-b border-white/10">
                <div className="col-span-5 font-medium">EXCHANGE</div>
                <div className="col-span-2 text-center font-medium">
                  TRUST SCORE
                </div>
                <div className="col-span-2 text-center font-medium">RANK</div>
                <div className="col-span-3 text-right font-medium">
                  24H VOLUME (BTC)
                </div>
              </div>
              {filteredExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  onClick={() => handleExchangeClick(exchange)}
                  className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors relative overflow-hidden cursor-pointer"
                >
                  <div className="grid grid-cols-12 gap-2 p-3 items-center relative group">
                    <div className="col-span-5 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden mr-3 border border-white/10 group-hover:border-teal-400/30 transition-all">
                        {exchange.image ? (
                          <Image
                            src={
                              exchange.image ||
                              "/placeholder.svg?height=20&width=20"
                            }
                            alt={exchange.name}
                            width={20}
                            height={20}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {exchange.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-zinc-100 font-medium truncate group-hover:text-teal-400 transition-colors block">
                          {exchange.name}
                        </span>
                        <span className="text-xs text-zinc-500 truncate block">
                          {exchange.url.replace(/^https?:\/\//, "")}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      {exchange.trust_score !== null ? (
                        <div className="inline-block">
                          {renderTrustScore(exchange.trust_score)}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">N/A</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center text-xs text-zinc-400">
                      {exchange.trust_score_rank !== null ? (
                        <span>#{exchange.trust_score_rank}</span>
                      ) : (
                        <span className="text-zinc-500">N/A</span>
                      )}
                    </div>
                    <div className="col-span-3 text-right text-xs text-zinc-400">
                      {exchange.trade_volume_24h_btc.toFixed(2)} BTC
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading overlay for search */}
          {isSearching && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-lg px-4 py-3 border border-white/10">
                <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                <span className="text-sm text-zinc-300">Searching...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exchange Detail Modal */}
      {selectedExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/15 bg-black/80 backdrop-blur-xl shadow-2xl"
          >
            {/* Modal background with logo */}
            {selectedExchange.image && (
              <div className="absolute inset-0 opacity-10">
                <Image
                  src={selectedExchange.image || "/placeholder.svg"}
                  alt=""
                  fill
                  className="object-cover blur-md"
                  unoptimized
                />
              </div>
            )}

            {/* Modal content */}
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20">
                    {selectedExchange.image ? (
                      <Image
                        src={selectedExchange.image || "/placeholder.svg"}
                        alt={selectedExchange.name}
                        width={32}
                        height={32}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-base">
                        {selectedExchange.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedExchange.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedExchange.trust_score !== null &&
                        renderTrustScore(selectedExchange.trust_score)}
                      {selectedExchange.trust_score_rank !== null && (
                        <span className="text-xs text-zinc-400">
                          Rank: #{selectedExchange.trust_score_rank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExchange(null)}
                  className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {selectedExchange.description ||
                      "No description available for this exchange."}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-xs font-medium text-zinc-300 mb-1">
                      24h Trading Volume
                    </h3>
                    <p className="text-lg font-medium text-teal-400">
                      {selectedExchange.trade_volume_24h_btc.toFixed(2)} BTC
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <h3 className="text-xs font-medium text-zinc-300 mb-1">
                      Trust Score
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedExchange.trust_score !== null ? (
                        <>
                          <div className="w-full bg-zinc-800 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-indigo-500 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (selectedExchange.trust_score / 10) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-zinc-300">
                            {selectedExchange.trust_score}/10
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500">
                          Not available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Website link */}
                <div className="mt-6">
                  <a
                    href={selectedExchange.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white rounded-lg transition-colors"
                  >
                    <span>Visit {selectedExchange.name} Website</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
