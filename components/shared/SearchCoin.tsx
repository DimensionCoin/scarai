"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import Link from "next/link";

interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

export default function SearchCoin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Cryptocurrency[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/coinlist?query=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (cryptoId: string) => {
    console.log("Clicked result, navigating to:", `/coin/${cryptoId}`);
  };

  return (
    <div className="relative w-full max-w-full mb-2">
      {/* Search input with glass effect */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-lg"></div>
        <div className="relative flex items-center border border-white/15 bg-black/10 backdrop-blur-xl rounded-lg overflow-hidden">
          <div className="flex items-center pl-3 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search over 9000 cryptocurrencies..."
            className="w-full bg-transparent py-2 px-3 text-base md:text-sm text-zinc-100 placeholder-zinc-500 outline-none"
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

      {/* Results dropdown with glass effect */}
      {showDropdown && (searchQuery.trim() !== "" || results.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 overflow-hidden rounded-lg border border-white/15 bg-black/30 backdrop-blur-xl shadow-lg"
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
              <p className="text-xs text-zinc-400 mt-1">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((crypto) => (
                <Link
                  key={crypto.id}
                  href={`/coin/${crypto.id}`} // Use crypto.id instead of slugify(crypto.name)
                  className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                  onClick={() => handleResultClick(crypto.id)} // Update to use crypto.id
                >
                  <div className="h-6 w-6 rounded-full bg-zinc-800/50 flex items-center justify-center overflow-hidden">
                    <Image
                      src={crypto.image || "/default-coin.png"}
                      alt={`${crypto.name} logo`}
                      width={16}
                      height={16}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {crypto.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {crypto.symbol.toUpperCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : searchQuery.trim() !== "" ? (
            <div className="p-4 text-center">
              <p className="text-sm text-zinc-400">No results found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
