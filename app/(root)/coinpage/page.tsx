"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Grid3X3,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Coin[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCoins: number;
    limit: number;
  };
}

export default function ExplorePage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  // Fetch coins with search and pagination
  const fetchCoins = useCallback(
    async (pageNum: number, search: string) => {
      if (!initialLoading) setLoading(true);
      try {
        const response = await fetch(
          `/api/displaycoins?page=${pageNum}&limit=30${
            search ? `&search=${search}` : ""
          }`
        );
        const data: ApiResponse = await response.json();

        if (data.success) {
          setCoins(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotalCoins(data.pagination.totalCoins);
        }
      } catch (error) {
        console.error("Error fetching coins:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [initialLoading]
  );

  // Handle search and pagination
  useEffect(() => {
    setPage(1); // Reset to first page when search changes
    fetchCoins(1, debouncedSearch);
  }, [debouncedSearch, fetchCoins]);

  useEffect(() => {
    fetchCoins(page, debouncedSearch);
  }, [page, debouncedSearch, fetchCoins]);

  // Scroll to top when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  // Clear search and focus input
  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

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
            Explore Cryptocurrencies
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Discover and explore the vast world of cryptocurrencies.
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or symbol..."
                  className="w-full bg-transparent py-2 px-3 text-base text-zinc-100 placeholder-zinc-500 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchQuery && (
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
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center mb-4">
          <div className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
            <p className="text-xs text-zinc-400">
              Showing{" "}
              <span className="text-teal-400 font-medium">
                {coins.length > 0 ? (page - 1) * 30 + 1 : 0} -{" "}
                {Math.min(page * 30, totalCoins)}
              </span>{" "}
              of <span className="text-teal-400 font-medium">{totalCoins}</span>{" "}
              cryptocurrencies
            </p>
          </div>
        </div>

        {/* Loading state */}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative h-16 w-16 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 blur-md"></div>
              <div className="relative h-16 w-16 rounded-full border-4 border-t-transparent border-teal-400/50 animate-spin"></div>
            </div>
            <p className="text-base text-zinc-400">
              Loading cryptocurrencies...
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 240px)" }}
          >
            {layout === "grid" ? (
              // Grid layout - compact and efficient
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {coins.map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="block aspect-square"
                  >
                    <div className="relative h-full rounded-xl overflow-hidden border border-white/10 hover:border-teal-500/30 transition-all duration-300 cursor-pointer group">
                      {/* Background */}
                      <div className="absolute inset-0 bg-zinc-900/20">
                        {coin.image && (
                          <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300">
                            <Image
                              src={
                                coin.image ||
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
                      <div className="relative h-full flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                          <div className="bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-300">
                            {coin.symbol.toUpperCase()}
                          </div>
                          <div className="h-4 w-4 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                            {coin.image ? (
                              <Image
                                src={
                                  coin.image ||
                                  "/placeholder.svg?height=20&width=20"
                                }
                                alt={coin.name}
                                width={20}
                                height={20}
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
                          <h3 className="text-sm font-medium text-white truncate group-hover:text-teal-400 transition-colors">
                            {coin.name}
                          </h3>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[70%] mt-1">
                            {coin.id.substring(0, 10)}
                            {coin.id.length > 10 ? "..." : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // List view - detailed information
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="bg-black/40 text-zinc-400 text-xs grid grid-cols-12 gap-2 p-3 border-b border-white/10">
                  <div className="col-span-7 sm:col-span-6 font-medium">
                    COIN
                  </div>
                  <div className="col-span-3 text-right font-medium">
                    SYMBOL
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-right font-medium">
                    UPDATED
                  </div>
                </div>
                {coins.map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="block border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors relative overflow-hidden"
                  >
                    <div className="grid grid-cols-12 gap-2 p-3 items-center relative cursor-pointer group">
                      <div className="col-span-7 sm:col-span-6 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center overflow-hidden mr-3 border border-white/10 group-hover:border-teal-400/30 transition-all">
                          {coin.image ? (
                            <Image
                              src={
                                coin.image ||
                                "/placeholder.svg?height=20&width=20"
                              }
                              alt={coin.name}
                              width={20}
                              height={20}
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">
                              {coin.symbol.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-zinc-100 font-medium truncate group-hover:text-teal-400 transition-colors">
                          {coin.name}
                        </span>
                      </div>
                      <div className="col-span-3 text-right text-xs text-zinc-400 uppercase">
                        {coin.symbol}
                      </div>
                      <div className="col-span-2 sm:col-span-3 text-right text-xs text-zinc-500">
                        {new Date(coin.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!initialLoading && coins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-medium text-zinc-300 mb-2">
                  No cryptocurrencies found
                </h3>
                <p className="text-sm text-zinc-500 max-w-md mb-6">
                  We couldn&apos;t find any cryptocurrencies matching your
                  search criteria. Try adjusting your search term.
                </p>

                {searchQuery && (
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
            )}

            {/* Loading overlay for pagination */}
            {loading && !initialLoading && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-lg px-4 py-3 border border-white/10">
                  <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                  <span className="text-sm text-zinc-300">Loading...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center rounded-lg overflow-hidden border border-white/15 bg-black/20 backdrop-blur-xl">
              {/* Previous page button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              {/* Page number input */}
              <div className="px-3 py-2 border-l border-r border-white/15 text-sm text-zinc-300 flex items-center">
                <input
                  type="number"
                  value={page}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value);
                    if (!isNaN(value) && value.toString() === e.target.value) {
                      setPage(Math.max(1, Math.min(totalPages, value)));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                      handlePageChange(page);
                    }
                  }}
                  className="w-14 bg-black/30 border border-white/10 rounded text-center py-1 px-1 text-white focus:border-teal-500/50 focus:outline-none"
                  min="1"
                  max={totalPages}
                />
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>

              {/* Next page button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
