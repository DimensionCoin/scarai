"use client"

import type React from "react"

import { useEffect, useState, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { GiCrystalBall } from "react-icons/gi"
import { useUserContext } from "@/providers/UserProvider"
import { useUser } from "@clerk/nextjs"
import { Send, X, Search } from "lucide-react"
import Image from "next/image"

// Cryptocurrency interface
interface Cryptocurrency {
  id: string
  name: string
  symbol: string
  image: string
}

interface OracleButtonProps {
  children: ReactNode
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function OracleButton({ children }: OracleButtonProps) {
  const [isScrolling, setIsScrolling] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Coin search state
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)
  const [coinSearchQuery, setCoinSearchQuery] = useState("")
  const [coinResults, setcoinResults] = useState<Cryptocurrency[]>([])
  const [coinSearchLoading, setCoinSearchLoading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  // Change the variable name from dollarSignIndex to slashIndex for clarity
  const [slashIndex, setSlashIndex] = useState(-1)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const { refreshUser } = useUserContext()
  const { user } = useUser()

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isModalOpen])

  // Scroll handling for button animation
  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsScrolling(true)
      timeoutRef.current = setTimeout(() => setIsScrolling(false), 2000)
    }
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle clicks outside the coin dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCoinDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch coin results when search query changes
  useEffect(() => {
    if (!coinSearchQuery.trim()) {
      setcoinResults([])
      return
    }

    const fetchResults = async () => {
      setCoinSearchLoading(true)
      try {
        const response = await fetch(`/api/coinlist?query=${encodeURIComponent(coinSearchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setcoinResults(data.slice(0, 5)) // Limit to 5 results for better UX in chat
        }
      } catch (error) {
        console.error("Error fetching coin search results:", error)
      } finally {
        setCoinSearchLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchResults()
    }, 300)

    return () => clearTimeout(timer)
  }, [coinSearchQuery])

  // API call to /api/chat matching original logic
  const sendMessage = async () => {
    if (!input.trim()) return;

    setShowCoinDropdown(false);

    const userMessage: ChatMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    };

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

      // Initial placeholder assistant message
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: "", timestamp: new Date() },
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


      refreshUser(); // Update credits
    } catch (error: unknown) {
      console.error("Error streaming response:", error);
      let errorMessage = "⚠️ Something went wrong while loading the response.";

      if (error instanceof Error && error.message) {
        errorMessage += `\n\n${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };


  // In the handleInputChange function, replace the $ symbol check with / symbol check
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInput(newValue)

    // Get cursor position
    const cursorPos = e.target.selectionStart || 0
    setCursorPosition(cursorPos)

    // Check if the user just typed a / character
    const lastSlashIndex = newValue.lastIndexOf("/", cursorPos)

    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || newValue[lastSlashIndex - 1] === " ")) {
      // Extract the partial coin name after the / symbol
      const partialCoin = newValue.substring(lastSlashIndex + 1, cursorPos)

      // Check if there's a space after the partial coin name
      const hasSpaceAfter = partialCoin.includes(" ")

      // Only show dropdown and search if we have a / followed by some text without a space
      if (partialCoin !== "" && !hasSpaceAfter) {
        setSlashIndex(lastSlashIndex)
        setCoinSearchQuery(partialCoin)
        setShowCoinDropdown(true)
      } else if (lastSlashIndex === cursorPos - 1) {
        // Just the / was typed, show all coins
        setSlashIndex(lastSlashIndex)
        setCoinSearchQuery("")
        setShowCoinDropdown(true)
      } else {
        setShowCoinDropdown(false)
      }
    } else {
      setShowCoinDropdown(false)
    }
  }

  // Update the handleCoinSelect function to keep the / and add a space after the coin ID
  const handleCoinSelect = (coinId: string) => {
    // Find the selected coin
    const selectedCoin = coinResults.find((coin) => coin.id === coinId)
    if (!selectedCoin) return

    // Replace the partial coin name with the full coin id
    if (slashIndex !== -1) {
      const beforeSlash = input.substring(0, slashIndex)
      const afterPartialCoin = input.substring(cursorPosition)

      // Set the new input value with the selected coin, keeping the / and adding a space
      const newInput = `${beforeSlash}/${selectedCoin.id} ${afterPartialCoin}`
      setInput(newInput)

      // Set cursor position after the inserted coin name and the space
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = slashIndex + selectedCoin.id.length + 2 // +1 for the / sign and +1 for the space
          inputRef.current.setSelectionRange(newPosition, newPosition)
          inputRef.current.focus()
        }
      }, 0)
    }

    // Explicitly close the dropdown
    setShowCoinDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (showCoinDropdown && coinResults.length > 0) {
        // Select the first coin if dropdown is open
        handleCoinSelect(coinResults[0].id)
      } else {
        sendMessage()
      }
    } else if (e.key === "Escape") {
      setShowCoinDropdown(false)
    }
  }

  return (
    <div className="relative">
      {/* Render the children (layout content) */}
      {children}

      {/* Button and Modal */}
      {pathname !== "/oracle" && (
        <>
          {/* Chat Button */}
          <div
            className={`fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
              isScrolling || isHovering ? "scale-105" : "scale-100"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsModalOpen(true)}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/40 to-indigo-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div
              className={`relative flex items-center justify-center h-12 w-12 rounded-full border border-white/15 backdrop-blur-xl transition-all duration-300 ${
                isScrolling || isHovering ? "bg-black/30 border-teal-500/30" : "bg-black/20 border-white/10"
              }`}
            >
              <div className="relative">
                {(isScrolling || isHovering) && (
                  <div className="absolute -inset-2 rounded-full bg-teal-400/10 blur-sm transition-opacity duration-300"></div>
                )}
                <GiCrystalBall
                  size={24}
                  className={`transition-colors duration-300 ${
                    isScrolling || isHovering ? "text-teal-400" : "text-zinc-300"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Redesigned Chat Modal with Glass Morphism - More Mobile Friendly */}
          {isModalOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

              {/* Modal - Improved for mobile */}
              <div className="fixed inset-0 sm:inset-4 md:inset-8 z-50 flex items-center justify-center">
                <div className="relative w-full h-full sm:h-[90vh] md:h-[80vh] sm:max-w-4xl overflow-hidden rounded-none sm:rounded-2xl border border-white/15 shadow-2xl">
                  {/* Glass background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/10 backdrop-blur-xl"></div>

                  {/* Subtle animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-indigo-500/5 opacity-50"></div>

                  {/* Content container */}
                  <div className="relative flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-3 sm:p-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-teal-400/20 blur-sm"></div>
                          <GiCrystalBall size={24} className="text-teal-400 relative" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-medium text-white">Oracle AI Assistant</h2>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                      >
                        <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-3 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-2">
                          <div className="relative">
                            <div className="absolute -inset-4 rounded-full bg-teal-400/10 blur-md animate-pulse"></div>
                            <GiCrystalBall size={48} className="text-teal-400 relative" />
                          </div>
                          <p className="text-zinc-300 max-w-md">
                            Ask me anything about crypto markets, trading strategies, or technical analysis.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-md">
                            {[
                              "What's the best crypto to invest in?",
                              "Explain Bitcoin halving",
                              "How to analyze crypto charts?",
                              "What is DeFi?",
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setInput(suggestion)
                                  inputRef.current?.focus()
                                }}
                                className="p-2 text-sm text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-teal-500/30 transition-colors text-zinc-300"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[80%] ${
                                msg.role === "user"
                                  ? "bg-teal-500/20 text-teal-50 border border-teal-500/30"
                                  : "bg-white/10 text-zinc-100 border border-white/10"
                              } rounded-2xl px-4 py-3 shadow-lg`}
                            >
                              <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                              <span className="block text-xs opacity-60 mt-1">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      {/* Loading indicator */}
                      {loading && (
                        <div className="mb-4 flex justify-start">
                          <div className="max-w-[85%] sm:max-w-[80%] bg-white/10 text-zinc-100 border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                            <div className="flex items-center space-x-2">
                              <div
                                className="h-2 w-2 bg-teal-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="h-2 w-2 bg-teal-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="h-2 w-2 bg-teal-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <span className="block text-xs opacity-60 mt-2">
                              {new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 sm:p-4 border-t border-white/10 bg-black/20">
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask the Oracle..."
                            className="flex-1 p-3 bg-white/5 text-white rounded-xl border border-white/10 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 placeholder-zinc-500 text-base"
                            disabled={loading}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="p-3 rounded-xl bg-gradient-to-r from-teal-500/80 to-teal-400/80 hover:from-teal-500 hover:to-teal-400 text-white disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                          >
                            {loading ? (
                              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        {/* Coin search dropdown */}
                        {showCoinDropdown && (
                          <div
                            ref={dropdownRef}
                            className="absolute bottom-full mb-1 left-0 w-full overflow-hidden rounded-lg border border-white/15 bg-black/30 backdrop-blur-xl shadow-lg z-20"
                          >
                            <div className="p-2 border-b border-white/10 flex items-center gap-2">
                              <Search className="h-3.5 w-3.5 text-teal-400" />
                              <span className="text-xs text-zinc-400">
                                {coinSearchQuery ? `Searching for "${coinSearchQuery}"` : "Select a cryptocurrency"}
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
                                      <p className="text-sm font-medium text-zinc-100 truncate">{crypto.name}</p>
                                      <p className="text-xs text-zinc-500">
                                        ${crypto.id} <span className="opacity-50">•</span> {crypto.symbol.toUpperCase()}
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
                                <p className="text-sm text-zinc-400">Type to search for cryptocurrencies</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

