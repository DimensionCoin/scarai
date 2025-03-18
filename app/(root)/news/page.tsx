"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarIcon,
  Search,
  Filter,
  ArrowUpDown,
  Twitter,
  MessageSquareText,
  Coins,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/articles");

        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success && data.data) {
          if (Array.isArray(data.data)) {
            setArticles(data.data);
            setFilteredArticles(data.data);
          } else {
            setArticles([data.data]);
            setFilteredArticles([data.data]);
          }
        } else {
          throw new Error(data.error || "No articles found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...articles];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          (article.summary && article.summary.toLowerCase().includes(query)) ||
          (article.content && article.content.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      if (filterBy === "hasCoinData") {
        result = result.filter(
          (article) => article.coinData && article.coinData.length > 0
        );
      } else if (filterBy === "hasInfluencers") {
        result = result.filter(
          (article) => article.influencers && article.influencers.length > 0
        );
      } else if (filterBy === "hasTweets") {
        result = result.filter(
          (article) => article.sourceTweets && article.sourceTweets.length > 0
        );
      }
    }

    // Apply sorting
    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "mostCoins") {
      result.sort((a, b) => {
        const aCoins = a.coinData?.length || 0;
        const bCoins = b.coinData?.length || 0;
        return bCoins - aCoins;
      });
    } else if (sortBy === "mostInfluencers") {
      result.sort((a, b) => {
        const aInfluencers = a.influencers?.length || 0;
        const bInfluencers = b.influencers?.length || 0;
        return bInfluencers - aInfluencers;
      });
    }

    setFilteredArticles(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [articles, searchQuery, sortBy, filterBy]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        day: format(date, "dd"),
        month: format(date, "MMM"),
        year: format(date, "yyyy"),
        full: format(date, "MMM d, yyyy"),
        relative: formatRelativeDate(date),
      };
    } catch {
      return {
        day: "--",
        month: "---",
        year: "----",
        full: "Unknown date",
        relative: "Unknown",
      };
    }
  };

  // Format relative date
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    return format(date, "MMM d, yyyy");
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

  // Handle article selection
  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  // Pagination
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(
    indexOfFirstArticle,
    indexOfLastArticle
  );
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <motion.div
        className="flex justify-center mt-8 gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Logic to show pages around current page
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={i}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(pageNum)}
                className={
                  currentPage === pageNum
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
                }
              >
                {pageNum}
              </Button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="flex items-center text-zinc-500">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(totalPages)}
                className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
        >
          Next
        </Button>
      </motion.div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
        {/* Glassmorphism background with blur effect */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto py-12 px-4 relative z-10">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3 text-white">
              Market Insights
            </h1>
            <p className="text-zinc-400 text-lg">
              Loading the latest crypto market analysis and trends...
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="flex gap-6">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-1/4 mb-3" />
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex gap-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-20 blur-lg animate-pulse"></div>
              <Loader2 className="h-8 w-8 animate-spin text-teal-400 relative" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
        {/* Glassmorphism background with blur effect */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto py-12 px-4 relative z-10">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3 text-white">
              Market Insights
            </h1>
            <p className="text-zinc-400 text-lg">
              Stay updated with the latest crypto market analysis and trends
            </p>
          </motion.div>

          <motion.div
            className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-12 text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/10 text-rose-400 mb-6">
              <X className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-medium text-rose-400 mb-4">
              Error Loading Articles
            </h3>
            <p className="text-zinc-300 mb-6 text-lg">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-zinc-700/70 hover:bg-zinc-600 text-zinc-100 border border-zinc-600/50 px-6 py-2 text-lg"
              size="lg"
            >
              Try Again
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
        {/* Glassmorphism background with blur effect */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto py-12 px-4 relative z-10">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3 text-white">
              Market Insights
            </h1>
            <p className="text-zinc-400 text-lg">
              Stay updated with the latest crypto market analysis and trends
            </p>
          </motion.div>

          <motion.div
            className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-12 text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800/70 text-zinc-400 mb-6">
              <MessageSquareText className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-medium text-zinc-200 mb-4">
              No Articles Available
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto text-lg">
              There are currently no market insights available. Please check
              back later for updates.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // No results after filtering
  if (filteredArticles.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
        {/* Glassmorphism background with blur effect */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto py-12 px-4 relative z-10">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3 text-white">
              Market Insights
            </h1>
            <p className="text-zinc-400 text-lg">
              Stay updated with the latest crypto market analysis and trends
            </p>
          </motion.div>

          {/* Search and filter controls */}
          <motion.div
            className="mb-12 p-4 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12 text-lg"
                />
              </div>

              <div className="flex gap-3">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[200px] bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-zinc-500" />
                      <SelectValue placeholder="Filter by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800/90 backdrop-blur-md border-zinc-700 text-zinc-300">
                    <SelectItem value="all">All Articles</SelectItem>
                    <SelectItem value="hasCoinData">Has Coin Data</SelectItem>
                    <SelectItem value="hasInfluencers">
                      Has Influencers
                    </SelectItem>
                    <SelectItem value="hasTweets">Has Tweets</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px] bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5 text-zinc-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800/90 backdrop-blur-md border-zinc-700 text-zinc-300">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="mostCoins">Most Coins</SelectItem>
                    <SelectItem value="mostInfluencers">
                      Most Influencers
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-12 text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800/70 text-zinc-400 mb-6">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-medium text-zinc-200 mb-4">
              No Matching Results
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto mb-6 text-lg">
              No articles match your current search criteria. Try adjusting your
              filters or search query.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSortBy("newest");
                setFilterBy("all");
              }}
              className="bg-zinc-700/70 hover:bg-zinc-600 text-zinc-100 border border-zinc-600/50 px-6 py-2 text-lg"
              size="lg"
            >
              Clear Filters
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
      {/* Glassmorphism background with blur effect */}
      <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto py-12 px-4 relative z-10">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-3 text-white">
            Market Insights
          </h1>
          <p className="text-zinc-400 text-lg">
            Stay updated with the latest crypto market analysis and trends
          </p>
        </motion.div>

        {/* Search and filter controls */}
        <motion.div
          className="mb-8 p-4 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12 text-lg"
              />
            </div>

            <div className="flex gap-3">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[200px] bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-zinc-500" />
                    <SelectValue placeholder="Filter by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800/90 backdrop-blur-md border-zinc-700 text-zinc-300">
                  <SelectItem value="all">All Articles</SelectItem>
                  <SelectItem value="hasCoinData">Has Coin Data</SelectItem>
                  <SelectItem value="hasInfluencers">
                    Has Influencers
                  </SelectItem>
                  <SelectItem value="hasTweets">Has Tweets</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] bg-zinc-800/50 backdrop-blur-sm border-zinc-700/30 text-zinc-300 h-12">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-zinc-500" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800/90 backdrop-blur-md border-zinc-700 text-zinc-300">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="mostCoins">Most Coins</SelectItem>
                  <SelectItem value="mostInfluencers">
                    Most Influencers
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Results summary */}
        <motion.div
          className="mb-6 flex justify-between items-center bg-zinc-800/20 backdrop-blur-sm border border-zinc-700/20 rounded-lg px-4 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-zinc-400">
            Showing{" "}
            <span className="text-zinc-200 font-medium">
              {indexOfFirstArticle + 1}-
              {Math.min(indexOfLastArticle, filteredArticles.length)}
            </span>{" "}
            of{" "}
            <span className="text-zinc-200 font-medium">
              {filteredArticles.length}
            </span>{" "}
            articles
          </p>

          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            >
              Clear search
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {currentArticles.map((article, index) => {
              const dateFormatted = formatDate(article.createdAt);

              return (
                <motion.div
                  key={article._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl overflow-hidden hover:border-teal-500/40 transition-colors cursor-pointer group"
                  onClick={() => handleArticleClick(article)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="p-6 flex gap-6">
                    {/* Calendar date */}
                    <div className="hidden md:flex flex-shrink-0 bg-zinc-800/70 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-700/50 w-20 h-20 flex-col items-center justify-center group-hover:border-teal-500/40 transition-colors">
                      <span className="text-teal-400 text-sm font-medium">
                        {dateFormatted.month}
                      </span>
                      <span className="text-zinc-100 text-2xl font-bold leading-none">
                        {dateFormatted.day}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {dateFormatted.year}
                      </span>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5 bg-zinc-800/50 backdrop-blur-sm px-2 py-1 rounded-full border border-zinc-700/30">
                          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                          <span className="text-sm text-zinc-300">
                            Market Analysis
                          </span>
                        </div>

                        <div className="md:hidden flex items-center gap-1.5 text-sm text-zinc-500">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>{dateFormatted.relative}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-medium text-zinc-100 group-hover:text-teal-400 transition-colors mb-3">
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-zinc-400 line-clamp-2 mb-4 text-base">
                          {article.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {article.influencers &&
                          article.influencers.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/30">
                              <Twitter className="h-3.5 w-3.5 text-blue-400" />
                              <span className="text-zinc-300">
                                {article.influencers.length} Influencers
                              </span>
                            </div>
                          )}

                        {article.sourceTweets &&
                          article.sourceTweets.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/30">
                              <MessageSquareText className="h-3.5 w-3.5 text-teal-400" />
                              <span className="text-zinc-300">
                                {article.sourceTweets.length} Sources
                              </span>
                            </div>
                          )}

                        {article.coinData && article.coinData.length > 0 && (
                          <div className="flex items-center gap-1.5 text-sm bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/30">
                            <Coins className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-zinc-300">
                              {article.coinData.length} Coins
                            </span>
                          </div>
                        )}

                        <div className="hidden md:flex ml-auto items-center text-sm text-zinc-500">
                          <span>{dateFormatted.relative}</span>
                        </div>
                      </div>
                    </div>

                    {/* Read more button */}
                    <div className="flex-shrink-0 self-center ml-auto">
                      <div className="bg-zinc-800/50 rounded-full p-2 text-zinc-500 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition-all duration-300">
                        <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Coin data preview */}
                  {article.coinData && article.coinData.length > 0 && (
                    <div className="bg-zinc-900/50 backdrop-blur-sm border-t border-zinc-800/50 px-6 py-4">
                      <div className="flex items-center gap-3 overflow-x-auto pb-1 custom-scrollbar">
                        <span className="text-sm text-zinc-500 whitespace-nowrap">
                          Trending:
                        </span>
                        {article.coinData.slice(0, 5).map((coin, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/30 rounded-md px-3 py-1.5 text-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            <span className="text-zinc-200 font-medium">
                              {coin.symbol}
                            </span>
                            {formatPriceChange(coin.priceChange24h)}
                          </div>
                        ))}
                        {article.coinData.length > 5 && (
                          <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/30 rounded-md px-3 py-1.5 text-sm text-zinc-400 whitespace-nowrap">
                            +{article.coinData.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {renderPagination()}

        {/* Article detail dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
            {selectedArticle && (
              <>
                {/* Glassmorphism background with blur effect */}
                <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xl rounded-2xl"></div>

                {/* Decorative elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex items-start gap-4">
                    {/* Calendar date */}
                    <motion.div
                      className="hidden md:flex flex-shrink-0 bg-zinc-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-700/50 w-20 h-20 flex-col items-center justify-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-teal-400 text-xs font-medium">
                        {formatDate(selectedArticle.createdAt).month}
                      </span>
                      <span className="text-zinc-100 text-3xl font-bold leading-none">
                        {formatDate(selectedArticle.createdAt).day}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {formatDate(selectedArticle.createdAt).year}
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
                          {formatDate(selectedArticle.createdAt).full}
                        </div>
                      </motion.div>

                      <motion.h2
                        className="text-xl md:text-3xl font-bold text-zinc-100 leading-tight"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {selectedArticle.title}
                      </motion.h2>
                    </div>
                  </div>

                  <motion.div
                    className="mt-6 flex flex-wrap gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {selectedArticle.influencers &&
                      selectedArticle.influencers.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm bg-zinc-800/30 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-700/30">
                          <Twitter className="h-4 w-4 text-blue-400" />
                          <span className="text-zinc-300">
                            {selectedArticle.influencers.length} Influencers
                          </span>
                        </div>
                      )}

                    {selectedArticle.sourceTweets &&
                      selectedArticle.sourceTweets.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm bg-zinc-800/30 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-700/30">
                          <MessageSquareText className="h-4 w-4 text-teal-400" />
                          <span className="text-zinc-300">
                            {selectedArticle.sourceTweets.length} Sources
                          </span>
                        </div>
                      )}

                    {selectedArticle.coinData &&
                      selectedArticle.coinData.length > 0 && (
                        <div className="flex items-center gap-1.5 text-sm bg-zinc-800/30 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-700/30">
                          <Coins className="h-4 w-4 text-amber-400" />
                          <span className="text-zinc-300">
                            {selectedArticle.coinData.length} Cryptocurrencies
                          </span>
                        </div>
                      )}
                  </motion.div>

                  <Tabs defaultValue="content" className="mt-6">
                    <TabsList className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 p-1 w-full md:w-auto">
                      <TabsTrigger
                        value="content"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-teal-400"
                      >
                        Analysis
                      </TabsTrigger>
                      <TabsTrigger
                        value="coins"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-teal-400"
                      >
                        Cryptocurrencies
                      </TabsTrigger>
                      <TabsTrigger
                        value="sources"
                        className="data-[state=active]:bg-zinc-700/50 data-[state=active]:text-teal-400"
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
                            className="bg-zinc-800/20 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {selectedArticle.summary && (
                              <div className="mb-6">
                                <h3 className="text-lg font-medium text-teal-400 mb-2">
                                  Summary
                                </h3>
                                <p className="text-zinc-300 bg-zinc-800/40 backdrop-blur-sm p-4 rounded-lg border border-zinc-700/30">
                                  {selectedArticle.summary}
                                </p>
                              </div>
                            )}

                            <div className="prose prose-invert max-w-none">
                              {selectedArticle.content ? (
                                selectedArticle.content
                                  .split("\n")
                                  .map((paragraph, idx) => (
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
                                <p className="text-zinc-400">
                                  No content available
                                </p>
                              )}
                            </div>
                          </motion.div>
                        </TabsContent>

                        <TabsContent
                          value="coins"
                          className="mt-0 data-[state=active]:block"
                        >
                          <motion.div
                            className="bg-zinc-800/20 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {selectedArticle.coinData &&
                            selectedArticle.coinData.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedArticle.coinData.map((coin, idx) => (
                                  <motion.div
                                    key={idx}
                                    className="bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 hover:border-teal-500/30 transition-colors"
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
                                        <div className="w-8 h-8 bg-zinc-700/50 rounded-full flex items-center justify-center">
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
                                      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-2">
                                        <div className="text-xs text-zinc-500 mb-1">
                                          Volume (24h)
                                        </div>
                                        <div className="text-zinc-200 font-medium">
                                          $
                                          {(coin.volume24h / 1000000).toFixed(
                                            2
                                          )}
                                          M
                                        </div>
                                      </div>
                                      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-2">
                                        <div className="text-xs text-zinc-500 mb-1">
                                          Market Cap
                                        </div>
                                        <div className="text-zinc-200 font-medium">
                                          $
                                          {(coin.marketCap / 1000000).toFixed(
                                            2
                                          )}
                                          M
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
                            className="bg-zinc-800/20 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh] custom-scrollbar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Influencers */}
                              {selectedArticle.influencers &&
                                selectedArticle.influencers.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium text-teal-400 mb-3 flex items-center gap-2">
                                      <Twitter className="h-5 w-5" />
                                      Mentioned Influencers
                                    </h3>
                                    <div className="bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {selectedArticle.influencers.map(
                                          (influencer, idx) => (
                                            <motion.div
                                              key={idx}
                                              className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm p-2 rounded-lg"
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{
                                                duration: 0.3,
                                                delay: 0.1 + idx * 0.03,
                                              }}
                                              whileHover={{ scale: 1.02 }}
                                            >
                                              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                <Twitter className="h-4 w-4 text-blue-400" />
                                              </div>
                                              <span className="text-zinc-300 font-medium">
                                                @{influencer}
                                              </span>
                                            </motion.div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Source Tweets */}
                              {selectedArticle.sourceTweets &&
                                selectedArticle.sourceTweets.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium text-teal-400 mb-3 flex items-center gap-2">
                                      <MessageSquareText className="h-5 w-5" />
                                      Source Tweets
                                    </h3>
                                    <div className="bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4">
                                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedArticle.sourceTweets.map(
                                          (tweet, idx) => (
                                            <motion.div
                                              key={idx}
                                              className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-sm p-3 rounded-lg border border-zinc-800/50"
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{
                                                duration: 0.3,
                                                delay: 0.1 + idx * 0.03,
                                              }}
                                              whileHover={{ scale: 1.01 }}
                                            >
                                              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
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
                                                        new Date(
                                                          tweet.timestamp
                                                        ),
                                                        "MMM d, yyyy"
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-xs text-zinc-400 mt-1">
                                                  Tweet ID: {tweet.tweetId}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )
                                        )}
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
                      onClick={() => setDialogOpen(false)}
                      className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
