"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Send,
  Zap,
  RefreshCw,
  Clock,
  Bitcoin,
  TrendingUp,
  BarChart2,
  DollarSignIcon,
  ChevronRight,
  LightbulbIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@clerk/nextjs";
import { useUserContext } from "@/providers/UserProvider";
import { useUser } from "@clerk/nextjs";

// Example queries that will be randomly selected - shorter for mobile
const exampleQueries = [
  "Current $BTC price trend?",
  "How do interest rates affect crypto?",
  "Compare $BTC and $ETH investments",
  "Top 5 altcoins to watch",
  "Explain DeFi simply",
  "How does blockchain work?",
  "What causes crypto volatility?",
  "Explain crypto market cap",
  "Proof of work vs proof of stake?",
  "How to evaluate crypto projects?",
  "Crypto investing risks?",
  "How is $SOL performing today",
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
  const [inputHeight, setInputHeight] = useState(64); // Default height for input area
  const { refreshUser } = useUserContext();
  const { user } = useUser();

  // Select random example queries on initial load
  useEffect(() => {
    // Shuffle array and take first 3
    const shuffled = [...exampleQueries].sort(() => 0.5 - Math.random());
    setSuggestedQueries(shuffled.slice(0, 3));
  }, []);

  // Measure input height for proper padding
  useEffect(() => {
    const inputArea = document.getElementById("chat-input-area");
    if (inputArea) {
      const height = inputArea.offsetHeight;
      setInputHeight(height);
    }
  }, []);

  // Auto-scrolling effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    setShowProTip(false);

    const userMessage = { role: "user", content: input, timestamp: new Date() };
    setMessages([...messages, userMessage]);
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

      const data = await response.json();

      if (response.ok && data.response) {
        setMessages([
          ...messages,
          userMessage,
          { role: "assistant", content: data.response, timestamp: new Date() },
        ]);
        refreshUser();
      } else {
        throw new Error(data.error || "Invalid response from server");
      }
    } catch (error: unknown) {
      console.error("Error sending message:", error);

      // Type guard to safely handle the error
      let errorMessage = "Something went wrong. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setMessages([
        ...messages,
        userMessage,
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
      sendMessage();
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  // Calculate the bottom padding based on whether pro tip is shown
  const bottomPadding = showProTip ? inputHeight + 40 : inputHeight;

  return (
    <div className="flex flex-col relative w-full h-full">
      {/* Messages container - with padding at bottom for fixed input */}
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
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-white" />
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
                      <p className="text-zinc-100 whitespace-pre-wrap text-xs sm:text-sm">
                        {msg.content}
                      </p>
                    </div>
                    <div className="mt-1 text-[9px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-2 w-2" />
                      {formatTime(msg.timestamp)}
                    </div>

                    {/* Show example queries after the first assistant message and when there's only one message */}
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
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center">
                  <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="bg-black/10 backdrop-blur-md rounded-xl border border-white/10 p-3">
                    <div className="flex space-x-2">
                      <div
                        className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce"
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

      {/* Pro Tip - appears above input and disappears after first message */}
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
                    <DollarSignIcon className="h-2 w-2" />
                    coin-name
                  </span>{" "}
                  for coin data (e.g.,{" "}
                  <span className="font-medium">$hedera-hashgraph</span>,{" "}
                  <span className="font-medium">$the-open-network</span>,{" "}
                  <span className="font-medium">$solana</span>). To search X
                  posts, mention a username (e.g.,{" "}
                  <span className="font-medium">@cz_binance</span>).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area - fixed to bottom */}
      <div
        id="chat-input-area"
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-white/10 pt-2 pb-3 py-2 px-2 z-10 md:ml-50"
      >
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
        </div>
      </div>
    </div>
  );
}
