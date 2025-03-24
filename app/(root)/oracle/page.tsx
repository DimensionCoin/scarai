"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Loader2,
  Send,
  Clock,
  Bitcoin,
  TrendingUp,
  BarChart2,
  DollarSignIcon,
  ChevronRight,
  LightbulbIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@clerk/nextjs";
import { useUserContext } from "@/providers/UserProvider";
import { useUser } from "@clerk/nextjs";
import LavaLampEffect from "@/components/shared/LavaLampEffect";
// Import the MessageFormatter component
import MessageFormatter from "@/components/shared/MessageFormatter";

// Cryptocurrency interface
interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

// Example queries that will be randomly selected - shorter for mobile
const exampleQueries = [
  "Current /bitcoin price trend?",
  "How do interest rates affect crypto?",
  "Compare /bitcoin and /ethereum investments",
  "Top 5 altcoins to watch",
  "Explain DeFi simply",
  "How does blockchain work?",
  "What causes crypto volatility?",
  "Explain crypto market cap",
  "Proof of work vs proof of stake?",
  "How to evaluate crypto projects?",
  "Crypto investing risks?",
  "How is /SOL performing today",
  "has @ansem said anything about meme coins",
];

// Icons for the example queries
const queryIcons = [
  <Bitcoin key="bitcoin" className="h-3.5 w-3.5" />,
  <TrendingUp key="trending" className="h-3.5 w-3.5" />,
  <BarChart2 key="chart" className="h-3.5 w-3.5" />,
  <DollarSignIcon key="dollar" className="h-3.5 w-3.5" />,
];

export default function ChatPage() {
  const [messages, setMessages] = useState<
    { role: string; content: string; timestamp?: Date }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [showProTip, setShowProTip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(64);
  const { refreshUser } = useUserContext();
  const { user } = useUser();

  const [showCoinDropdown, setShowCoinDropdown] = useState(false);
  const [coinSearchQuery, setCoinSearchQuery] = useState("");
  const [coinResults, setcoinResults] = useState<Cryptocurrency[]>([]);
  const [coinSearchLoading, setCoinSearchLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dollarSignIndex, setDollarSignIndex] = useState(-1);

  useEffect(() => {
    const shuffled = [...exampleQueries].sort(() => 0.5 - Math.random());
    setSuggestedQueries(shuffled.slice(0, 3));
  }, []);

  useEffect(() => {
    const inputArea = document.getElementById("chat-input-area");
    if (inputArea) {
      const height = inputArea.offsetHeight;
      setInputHeight(height);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm your crypto assistant. I can analyze market trends, provide investment insights, and explain complex crypto concepts in simple terms. What would you like to know today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCoinDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!coinSearchQuery.trim()) {
      setcoinResults([]);
      return;
    }

    const fetchResults = async () => {
      setCoinSearchLoading(true);
      try {
        const response = await fetch(
          `/api/coinlist?query=${encodeURIComponent(coinSearchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setcoinResults(data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching coin search results:", error);
      } finally {
        setCoinSearchLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [coinSearchQuery]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setShowProTip(false);
    setShowCoinDropdown(false);

    const userMessage = { role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          message: input,
          chatHistory: messages,
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(
          `Invalid streaming response (Status ${response.status}): ${errorText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantMessage = "";

      // Placeholder message for streaming output
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      const updateMessage = (content: string) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content,
          };
          return updated;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!assistantMessage && chunk) {
          // First token received, stop loading indicator
          setLoading(false);
        }

        assistantMessage += chunk;
        updateMessage(assistantMessage);
      }

      refreshUser(); // ✅ Update credit count after success
    } catch (error: unknown) {
      console.error("Error streaming response:", error);
      let errorMessage = "⚠️ Something went wrong while loading the response.";

      if (error instanceof Error && error.message) {
        errorMessage += `\n\n${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showCoinDropdown && coinResults.length > 0) {
        handleCoinSelect(coinResults[0].id);
      } else {
        sendMessage();
      }
    } else if (e.key === "Escape") {
      setShowCoinDropdown(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    const lastSlashIndex = newValue.lastIndexOf("/", cursorPos);
    if (
      lastSlashIndex !== -1 &&
      (lastSlashIndex === 0 || newValue[lastSlashIndex - 1] === " ")
    ) {
      const partialCoin = newValue.substring(lastSlashIndex + 1, cursorPos);
      const hasSpaceAfter = partialCoin.includes(" ");
      if (partialCoin !== "" && !hasSpaceAfter) {
        setDollarSignIndex(lastSlashIndex);
        setCoinSearchQuery(partialCoin);
        setShowCoinDropdown(true);
      } else if (lastSlashIndex === cursorPos - 1) {
        setDollarSignIndex(lastSlashIndex);
        setCoinSearchQuery("");
        setShowCoinDropdown(true);
      } else {
        setShowCoinDropdown(false);
      }
    } else {
      setShowCoinDropdown(false);
    }
  };

  const handleCoinSelect = (coinId: string) => {
    const selectedCoin = coinResults.find((coin) => coin.id === coinId);
    if (!selectedCoin) return;

    if (dollarSignIndex !== -1) {
      const beforeSlash = input.substring(0, dollarSignIndex);
      const afterPartialCoin = input.substring(cursorPosition);
      const newInput = `${beforeSlash}/${selectedCoin.id} ${afterPartialCoin}`;
      setInput(newInput);

      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = dollarSignIndex + selectedCoin.id.length + 2; // +2 for the slash and space
          inputRef.current.setSelectionRange(newPosition, newPosition);
          inputRef.current.focus();
        }
      }, 0);
    }
    setShowCoinDropdown(false);
  };

  const formatTime = (date?: Date) =>
    date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";

  const handleExampleClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const bottomPadding = showProTip ? inputHeight + 40 : inputHeight;

  return (
    <div className="flex flex-col relative w-full h-full">
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        style={{ paddingBottom: `${bottomPadding}px` }}
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`${msg.role === "user" ? "" : "backdrop-blur-sm"}`}
            >
              <div className="w-full px-3 py-3">
                <div className="flex items-start gap-2">
                  {msg.role === "user" ? (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                      <UserButton />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                      <LavaLampEffect
                        size={48} // Slightly smaller for clarity in small space
                        containerStyle={{ transform: "scale(1)" }} // Ensure no extra scaling
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm ${
                        msg.role === "user"
                          ? ""
                          : "bg-black/10 backdrop-blur-md rounded-xl border border-white/10 p-3"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <MessageFormatter content={msg.content} />
                      ) : (
                        <p className="text-zinc-100 whitespace-pre-wrap text-xs sm:text-sm">
                          {typeof msg.content === "string"
                            ? msg.content
                            : JSON.stringify(msg.content)}
                        </p>
                      )}
                    </div>
                    <div className="mt-1 text-[9px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-2 w-2" />
                      {formatTime(msg.timestamp)}
                    </div>
                    {msg.role === "assistant" && messages.length === 1 && (
                      <div className="mt-3">
                        <p className="text-[10px] text-zinc-400 mb-1.5">
                          Try asking:
                        </p>
                        <div className="space-y-1.5">
                          {suggestedQueries.map((query, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.1 }}
                              onClick={() => handleExampleClick(query)}
                              className="w-full text-left px-2.5 py-2 bg-black/10 hover:bg-black/20 border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 group"
                            >
                              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-black/20 flex items-center justify-center text-teal-400 group-hover:text-teal-300">
                                {queryIcons[i % queryIcons.length]}
                              </span>
                              <span className="text-[10px] text-zinc-300 flex-1 truncate">
                                {query}
                              </span>
                              <ChevronRight className="h-2.5 w-2.5 text-zinc-500 group-hover:text-teal-400 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-sm"
          >
            <div className="w-full px-3 py-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                  <LavaLampEffect
                    size={48} // Consistent with message avatar
                    containerStyle={{ transform: "scale(1)" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-black/10 backdrop-blur-md rounded-xl border border-white/10 p-3">
                    <div className="flex space-x-2">
                      <div
                        className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {showProTip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-[64px] left-0 right-0 px-2 z-10 md:ml-50"
          >
            <div className="bg-black/20 backdrop-blur-md rounded-lg border border-teal-500/20 p-2 mb-1 flex items-start gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-teal-500/20 flex items-center justify-center mt-0.5">
                <LightbulbIcon className="h-3 w-3 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-zinc-300 leading-tight">
                  <span className="text-teal-400 font-medium">Pro tip:</span>{" "}
                  Use{" "}
                  <span className="inline-flex items-center bg-black/20 px-1 py-0.5 rounded text-teal-400">
                    /coin-name
                  </span>{" "}
                  for coin data (e.g.,{" "}
                  <span className="font-medium">/hedera-hashgraph</span>,{" "}
                  <span className="font-medium">/the-open-network</span>,{" "}
                  <span className="font-medium">/solana</span>
                  )
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        id="chat-input-area"
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-white/10 pt-2 pb-3 py-2 px-2 z-10 md:ml-50"
      >
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about crypto..."
            className="w-full bg-black/20 border border-white/10 text-white text-base md:text-sm placeholder-zinc-500 pr-10 py-2.5 rounded-lg focus-visible:ring-teal-500 focus-visible:border-teal-500/50 focus-visible:ring-offset-0"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </Button>

          {showCoinDropdown && (
            <div
              ref={dropdownRef}
              className="absolute bottom-full mb-2 left-0 w-full overflow-hidden rounded-lg border border-white/15 bg-black/70 backdrop-blur-xl shadow-lg z-20"
            >
              <div className="p-2 border-b border-white/10 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-xs text-zinc-400">
                  {coinSearchQuery
                    ? `Searching for "${coinSearchQuery}"`
                    : "Select a cryptocurrency"}
                </span>
              </div>
              {coinSearchLoading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
                  <p className="text-xs text-zinc-400 mt-1">Searching...</p>
                </div>
              ) : coinResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {coinResults.map((crypto) => (
                    <button
                      key={crypto.id}
                      onClick={() => handleCoinSelect(crypto.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 text-left"
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
                          ${crypto.id} <span className="opacity-50">•</span>{" "}
                          {crypto.symbol.toUpperCase()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : coinSearchQuery ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-zinc-400">No results found</p>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-zinc-400">
                    Type to search for cryptocurrencies
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
