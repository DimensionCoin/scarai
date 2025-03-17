"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExchangeCard from "@/components/exchange/exchange-card";
import ExchangeModal from "@/components/exchange/exchange-modal";

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

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [filteredExchanges, setFilteredExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allExchangesLoaded, setAllExchangesLoaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the "id" query parameter
  const selectedId = searchParams.get("id") || undefined;

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
        setAllExchangesLoaded(true);
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
    if (!allExchangesLoaded) return;

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
  }, [searchTerm, exchanges, allExchangesLoaded]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to clear search
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchTerm("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const selectedExchange = selectedId
    ? exchanges.find((exchange) => exchange.id === selectedId)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)]"></div>
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="container mx-auto p-4 relative z-10 flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-teal-400/20 blur-lg"></div>
            <Loader2 className="h-10 w-10 text-teal-400 animate-spin" />
          </div>
          <p className="mt-4 text-zinc-400 text-sm">Loading exchanges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)]"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-[80px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,20,20,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,20,20,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.h1
          className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Explore Crypto Exchanges
        </motion.h1>

        {/* Search Input with glass effect */}
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-xl"></div>
            <div className="relative flex items-center border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl overflow-hidden">
              <div className="flex items-center pl-4 text-zinc-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search exchanges by name or description... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent py-3 px-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
              />
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="pr-3 text-teal-400"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                )}
                {searchTerm && !isSearching && (
                  <motion.button
                    onClick={clearSearch}
                    className="pr-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search keyboard shortcut hint */}
          <div className="mt-2 text-center">
            <span className="text-xs text-zinc-500">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-black/30 border border-white/10 rounded text-zinc-400 font-mono">
                Ctrl+K
              </kbd>{" "}
              to search,{" "}
              <kbd className="px-1.5 py-0.5 bg-black/30 border border-white/10 rounded text-zinc-400 font-mono">
                Esc
              </kbd>{" "}
              to clear
            </span>
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div
          className="max-w-2xl mx-auto mb-6 text-sm text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {searchTerm ? (
            <p>
              Found {filteredExchanges.length}{" "}
              {filteredExchanges.length === 1 ? "exchange" : "exchanges"}{" "}
              matching &quot;{searchTerm}&quot;
            </p>
          ) : (
            <p>Showing all {filteredExchanges.length} exchanges</p>
          )}
        </motion.div>

        <AnimatePresence>
          {filteredExchanges.length === 0 ? (
            <motion.div
              className="relative overflow-hidden rounded-3xl max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl p-8 text-center">
                <p className="text-zinc-400">
                  {searchTerm
                    ? `No exchanges found matching "${searchTerm}"`
                    : "No exchanges available"}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-4 px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg text-teal-400 transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {filteredExchanges.map((exchange, index) => (
                <motion.div
                  key={exchange.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <ExchangeCard exchange={exchange} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedExchange && <ExchangeModal exchange={selectedExchange} />}
    </div>
  );
}
