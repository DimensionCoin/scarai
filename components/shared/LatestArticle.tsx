"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarIcon,
  Twitter,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  MessageSquareText,
  Coins,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the Article type based on your model
interface Tweet {
  tweetId: string;
  username: string;
  timestamp: Date;
}

interface CoinData {
  name: string;
  symbol: string;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
}

interface Article {
  _id: string;
  title: string;
  content: string;
  summary: string;
  influencers: string[];
  sourceTweets: Tweet[];
  coinData: CoinData[];
  createdAt: string;
}

export default function LatestArticle() {
  // Remove the activeTab state completely
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchLatestArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/articles?latest=true");

        if (!response.ok) {
          throw new Error(`Failed to fetch article: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success && data.data) {
          if (Array.isArray(data.data) && data.data.length > 0) {
            setArticle(data.data[0]);
          } else if (!Array.isArray(data.data)) {
            setArticle(data.data);
          } else {
            throw new Error("No articles found");
          }
        } else {
          throw new Error(data.error || "No article found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching latest article:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticle();
  }, []);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        day: format(date, "dd"),
        month: format(date, "MMM"),
        year: format(date, "yyyy"),
        full: format(date, "MMM d, yyyy"),
      };
    } catch {
      return {
        day: "--",
        month: "---",
        year: "----",
        full: "Unknown date",
      };
    }
  };

  // Price change formatter with color
  const formatPriceChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span
        className={`flex items-center ${
          isPositive ? "text-teal-400" : "text-rose-400"
        }`}
      >
        {isPositive ? "+" : ""}
        {change.toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl h-24 md:h-28">
        <div className="absolute inset-0 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-teal-400/20 blur-sm"></div>
              <Loader2 className="h-5 w-5 text-teal-400 animate-spin relative" />
            </div>
            <p className="text-zinc-400 text-sm">Loading latest insight...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-xl h-24 md:h-28">
        <div className="absolute inset-0 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl"></div>
        <div className="relative z-10 h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-rose-400/20 blur-sm"></div>
              <X className="h-5 w-5 text-rose-400 relative" />
            </div>
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            size="sm"
            className="border border-white/10 bg-black/20 hover:bg-black/30 text-zinc-300"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="relative overflow-hidden rounded-xl h-24 md:h-28">
        <div className="absolute inset-0 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl"></div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-amber-400/20 blur-sm"></div>
              <MessageSquareText className="h-5 w-5 text-amber-400 relative" />
            </div>
            <p className="text-zinc-300 text-sm">
              No articles available at this time
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dateFormatted = formatDate(article.createdAt);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          className="relative overflow-hidden rounded-xl cursor-pointer group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.005 }}
        >
          {/* Glass background */}
          <div className="absolute inset-0 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl transition-colors group-hover:border-teal-500/20"></div>

          {/* Subtle glow effect on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/0 to-indigo-500/0 rounded-xl opacity-0 group-hover:from-teal-500/20 group-hover:to-indigo-500/20 blur transition duration-300"></div>

          <div className="relative z-10 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            {/* Calendar date display */}
            <div className="flex-shrink-0 border border-white/10 bg-black/20 backdrop-blur-md rounded-lg overflow-hidden w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center group-hover:border-teal-500/30 transition-colors">
              <span className="text-teal-400 text-xs font-medium">
                {dateFormatted.month}
              </span>
              <span className="text-zinc-100 text-xl md:text-3xl font-bold leading-none">
                {dateFormatted.day}
              </span>
              <span className="text-zinc-500 text-xs">
                {dateFormatted.year}
              </span>
            </div>

            {/* Article title and stats */}
            <div className="flex-grow min-w-0 md:max-w-[40%]">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-teal-400" />
                <span className="text-xs text-zinc-500">Latest Analysis</span>
              </div>
              <h3 className="text-base md:text-lg font-medium text-zinc-100 group-hover:text-teal-400 transition-colors line-clamp-2 mb-1">
                {article.title}
              </h3>

              <div className="flex flex-wrap gap-2 mt-1">
                {article.influencers && article.influencers.length > 0 && (
                  <div className="flex items-center gap-1 text-xs border border-white/5 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                    <Twitter className="h-3 w-3 text-blue-400" />
                    <span className="text-zinc-400">
                      {article.influencers.length}
                    </span>
                  </div>
                )}

                {article.sourceTweets && article.sourceTweets.length > 0 && (
                  <div className="flex items-center gap-1 text-xs border border-white/5 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                    <MessageSquareText className="h-3 w-3 text-teal-400" />
                    <span className="text-zinc-400">
                      {article.sourceTweets.length}
                    </span>
                  </div>
                )}

                {article.coinData && article.coinData.length > 0 && (
                  <div className="flex items-center gap-1 text-xs border border-white/5 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                    <Coins className="h-3 w-3 text-amber-400" />
                    <span className="text-zinc-400">
                      {article.coinData.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coin data and summary */}
            <div className="flex-grow min-w-0 w-full md:w-auto">
              <div className="hidden md:block">
                <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                  {article.summary ||
                    (article.content
                      ? article.content.substring(0, 120) + "..."
                      : "No content available")}
                </p>
              </div>

              {article.coinData && article.coinData.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.coinData.slice(0, 3).map((coin, index) => (
                    <div
                      key={index}
                      className="border border-white/10 bg-black/20 backdrop-blur-md rounded-md px-2 py-1 text-xs flex items-center gap-1.5"
                    >
                      <span className="text-zinc-300 font-medium">
                        {coin.symbol}
                      </span>
                      {formatPriceChange(coin.priceChange24h)}
                    </div>
                  ))}
                  {article.coinData.length > 3 && (
                    <div className="border border-white/10 bg-black/20 backdrop-blur-md rounded-md px-2 py-1 text-xs text-zinc-400">
                      +{article.coinData.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Read more button */}
            <div className="flex-shrink-0 self-end md:self-center ml-auto">
              <div className="border border-white/10 bg-black/20 backdrop-blur-md rounded-full p-1.5 text-zinc-500 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all duration-300">
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
        {/* Glassmorphism background with blur effect */}
        <div className="absolute inset-0 border border-white/15 bg-black/30 backdrop-blur-xl rounded-2xl"></div>

        <div className="relative z-10 p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-start gap-4">
            {/* Calendar date */}
            <motion.div
              className="hidden md:flex flex-shrink-0 border border-white/10 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden w-20 h-20 flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-teal-400 text-xs font-medium">
                {dateFormatted.month}
              </span>
              <span className="text-zinc-100 text-3xl font-bold leading-none">
                {dateFormatted.day}
              </span>
              <span className="text-zinc-500 text-xs">
                {dateFormatted.year}
              </span>
            </motion.div>

            <div className="flex-grow">
              <motion.div
                className="flex flex-wrap items-center gap-2 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30">
                  Market Analysis
                </Badge>
                <div className="flex items-center gap-1 text-xs text-zinc-500 md:hidden">
                  <CalendarIcon className="h-3 w-3" />
                  {dateFormatted.full}
                </div>
              </motion.div>

              <motion.h2
                className="text-xl md:text-3xl font-bold text-zinc-100 leading-tight"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {article.title}
              </motion.h2>
            </div>
          </div>

          <motion.div
            className="mt-6 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {article.influencers && article.influencers.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                <Twitter className="h-4 w-4 text-blue-400" />
                <span className="text-zinc-300">
                  {article.influencers.length} Influencers
                </span>
              </div>
            )}

            {article.sourceTweets && article.sourceTweets.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                <MessageSquareText className="h-4 w-4 text-teal-400" />
                <span className="text-zinc-300">
                  {article.sourceTweets.length} Sources
                </span>
              </div>
            )}

            {article.coinData && article.coinData.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-zinc-300">
                  {article.coinData.length} Cryptocurrencies
                </span>
              </div>
            )}
          </motion.div>

          <Tabs defaultValue="content" className="mt-6">
            <TabsList className="border border-white/10 bg-black/20 backdrop-blur-md p-1 w-full md:w-auto">
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-black/30 data-[state=active]:text-teal-400"
              >
                Analysis
              </TabsTrigger>
              <TabsTrigger
                value="coins"
                className="data-[state=active]:bg-black/30 data-[state=active]:text-teal-400"
              >
                Cryptocurrencies
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="data-[state=active]:bg-black/30 data-[state=active]:text-teal-400"
              >
                Sources
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <TabsContent
                  value="content"
                  className="mt-0 data-[state=active]:block"
                >
                  <motion.div
                    className="border border-white/10 bg-black/10 backdrop-blur-md rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {article.summary && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-teal-400 mb-2">
                          Summary
                        </h3>
                        <p className="text-zinc-300 border border-white/10 bg-black/20 backdrop-blur-md p-4 rounded-lg">
                          {article.summary}
                        </p>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none">
                      {article.content ? (
                        article.content.split("\n").map((paragraph, idx) => (
                          <motion.p
                            key={idx}
                            className="text-zinc-300 mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.1 + idx * 0.05,
                            }}
                          >
                            {paragraph}
                          </motion.p>
                        ))
                      ) : (
                        <p className="text-zinc-400">No content available</p>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent
                  value="coins"
                  className="mt-0 data-[state=active]:block"
                >
                  <motion.div
                    className="border border-white/10 bg-black/10 backdrop-blur-md rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {article.coinData && article.coinData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {article.coinData.map((coin, idx) => (
                          <motion.div
                            key={idx}
                            className="border border-white/10 bg-black/20 backdrop-blur-md rounded-xl p-4 hover:border-teal-500/30 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.1 + idx * 0.05,
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border border-white/10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                  <Coins className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-zinc-100">
                                    {coin.name}
                                  </h3>
                                  <span className="text-xs text-zinc-500">
                                    {coin.symbol.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  coin.priceChange24h >= 0
                                    ? "text-teal-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {formatPriceChange(coin.priceChange24h)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="border border-white/10 bg-black/30 backdrop-blur-md rounded-lg p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Volume (24h)
                                </div>
                                <div className="text-zinc-200 font-medium">
                                  ${(coin.volume24h / 1000000).toFixed(2)}M
                                </div>
                              </div>
                              <div className="border border-white/10 bg-black/30 backdrop-blur-md rounded-lg p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Market Cap
                                </div>
                                <div className="text-zinc-200 font-medium">
                                  ${(coin.marketCap / 1000000).toFixed(2)}M
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-400">
                          No cryptocurrency data available
                        </p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent
                  value="sources"
                  className="mt-0 data-[state=active]:block"
                >
                  <motion.div
                    className="border border-white/10 bg-black/10 backdrop-blur-md rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Influencers */}
                      {article.influencers &&
                        article.influencers.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-teal-400 mb-3 flex items-center gap-2">
                              <Twitter className="h-5 w-5" />
                              Mentioned Influencers
                            </h3>
                            <div className="border border-white/10 bg-black/20 backdrop-blur-md rounded-xl p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {article.influencers.map((influencer, idx) => (
                                  <motion.div
                                    key={idx}
                                    className="flex items-center gap-2 border border-white/10 bg-black/30 backdrop-blur-md p-2 rounded-lg"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: 0.1 + idx * 0.03,
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <div className="w-8 h-8 border border-white/10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                      <Twitter className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="text-zinc-300 font-medium">
                                      @{influencer}
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-zinc-500 ml-auto" />
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Source Tweets */}
                      {article.sourceTweets &&
                        article.sourceTweets.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-teal-400 mb-3 flex items-center gap-2">
                              <MessageSquareText className="h-5 w-5" />
                              Source Tweets
                            </h3>
                            <div className="border border-white/10 bg-black/20 backdrop-blur-md rounded-xl p-4">
                              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {article.sourceTweets.map((tweet, idx) => (
                                  <motion.div
                                    key={idx}
                                    className="flex items-center gap-3 border border-white/10 bg-black/30 backdrop-blur-md p-3 rounded-lg"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: 0.1 + idx * 0.03,
                                    }}
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="w-10 h-10 border border-white/10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                                      <Twitter className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-zinc-200">
                                          @{tweet.username}
                                        </span>
                                        {tweet.timestamp && (
                                          <span className="text-zinc-500 text-xs">
                                            {format(
                                              new Date(tweet.timestamp),
                                              "MMM d, yyyy"
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-zinc-400 mt-1">
                                        Tweet ID: {tweet.tweetId}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-auto text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-black/30"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border border-white/10 bg-black/20 backdrop-blur-md text-zinc-300 hover:bg-black/30 hover:text-zinc-100"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
