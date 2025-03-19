"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GiCrystalBall } from "react-icons/gi";
import { useUserContext } from "@/providers/UserProvider";
import { useUser } from "@clerk/nextjs";
import { Send, X } from "lucide-react";

interface OracleButtonProps {
  children: ReactNode;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function OracleButton({ children }: OracleButtonProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Removed unused showProTip state variable
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { refreshUser } = useUserContext();
  const { user } = useUser();

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // Scroll handling for button animation
  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsScrolling(true);
      timeoutRef.current = setTimeout(() => setIsScrolling(false), 2000);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // API call to /api/chat matching original logic
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
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
          userId: user?.id, // Use Clerk's user ID
          message: input,
          chatHistory: messages,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant" as const,
            content: data.response,
            timestamp: new Date(),
          },
        ]);
        refreshUser(); // Refresh user data (e.g., credits)
      } else {
        throw new Error(data.error || "Invalid response from server");
      }
    } catch (error: unknown) {
      console.error("Error sending message:", error);

      let errorMessage = "Something went wrong. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
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
                isScrolling || isHovering
                  ? "bg-black/30 border-teal-500/30"
                  : "bg-black/20 border-white/10"
              }`}
            >
              <div className="relative">
                {(isScrolling || isHovering) && (
                  <div className="absolute -inset-2 rounded-full bg-teal-400/10 blur-sm transition-opacity duration-300"></div>
                )}
                <GiCrystalBall
                  size={24}
                  className={`transition-colors duration-300 ${
                    isScrolling || isHovering
                      ? "text-teal-400"
                      : "text-zinc-300"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Redesigned Chat Modal with Glass Morphism */}
          {isModalOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />

              {/* Modal */}
              <div className="fixed inset-8 z-50 flex items-center justify-center">
                <div className="relative w-full max-w-4xl h-[80vh] overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
                  {/* Glass background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/10 backdrop-blur-xl"></div>

                  {/* Subtle animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-indigo-500/5 opacity-50"></div>

                  {/* Content container */}
                  <div className="relative flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-full bg-teal-400/20 blur-sm"></div>
                          <GiCrystalBall
                            size={24}
                            className="text-teal-400 relative"
                          />
                        </div>
                        <h2 className="text-xl font-medium text-white">
                          Oracle AI Assistant
                        </h2>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 rounded-full hover:bg-white/5 transition-colors"
                      >
                        <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                          <div className="relative">
                            <div className="absolute -inset-4 rounded-full bg-teal-400/10 blur-md animate-pulse"></div>
                            <GiCrystalBall
                              size={48}
                              className="text-teal-400 relative"
                            />
                          </div>
                          <p className="text-zinc-300 max-w-md">
                            Ask me anything about crypto markets, trading
                            strategies, or technical analysis.
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-md">
                            {[
                              "What's the best crypto to invest in?",
                              "Explain Bitcoin halving",
                              "How to analyze crypto charts?",
                              "What is DeFi?",
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setInput(suggestion);
                                  inputRef.current?.focus();
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
                            className={`mb-4 flex ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] ${
                                msg.role === "user"
                                  ? "bg-teal-500/20 text-teal-50 border border-teal-500/30"
                                  : "bg-white/10 text-zinc-100 border border-white/10"
                              } rounded-2xl px-4 py-3 shadow-lg`}
                            >
                              <p className="whitespace-pre-wrap">
                                {msg.content}
                              </p>
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
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                      <div className="flex items-center gap-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Ask the Oracle..."
                          className="flex-1 p-3 bg-white/5 text-white rounded-xl border border-white/10 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 placeholder-zinc-500 text-base md:text-sm"
                          disabled={loading}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={loading}
                          className="p-3 rounded-xl bg-gradient-to-r from-teal-500/80 to-teal-400/80 hover:from-teal-500 hover:to-teal-400 text-white disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                        >
                          {loading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </button>
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
  );
}
