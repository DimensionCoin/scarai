"use client";

import type React from "react";
import { useMemo } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  Zap,
  BarChart2,
  Info,
  Percent,
  Coins,
} from "lucide-react";

interface MessageFormatterProps {
  content: string;
}

const MessageFormatter: React.FC<MessageFormatterProps> = ({ content }) => {
  // Detect if this is a trading recommendation
  const isTradingRecommendation = useMemo(() => {
    return (
      content.includes("**Direction:") &&
      (content.includes("**Current Price:") || content.includes("**Entry:"))
    );
  }, [content]);

  // Detect if this is a market overview
  const isMarketOverview = useMemo(() => {
    return (
      content.includes("crypto markets") &&
      (content.includes("trending") || content.includes("gain")) &&
      !isTradingRecommendation
    );
  }, [content]);

  // Format regular text with special handling for **bold** text
  const formatTextWithAsterisks = (text: string): React.ReactNode => {
    if (!text) return text;

    // Split the text by double asterisks
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      // Check if this part is surrounded by double asterisks
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove the asterisks and apply special styling
        const content = part.slice(2, -2);
        return (
          <span key={index} className="font-semibold text-teal-400">
            {content}
          </span>
        );
      }
      // Return regular text
      return part;
    });
  };

  // Extract sections from trading recommendation
  const extractTradingRecommendation = () => {
    const getSection = (sectionName: string): string => {
      const regex = new RegExp(
        `\\*\\*${sectionName}:(?:\\*\\*)?([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`,
        "i"
      );
      const match = content.match(regex);
      return match ? match[1].trim().replace(/\*\*/g, "") : "";
    };

    const direction = getSection("Direction");
    const currentPrice = getSection("Current Price");
    const entry = getSection("Entry");
    const exitTarget = getSection("Exit target");
    const stopLoss = getSection("Stop-loss");
    const liquidation = getSection("Liquidation");

    // Extract risk note and macro summary
    const riskNoteMatch = content.match(
      /\*\*Risk note:\*\*\s*([\s\S]*?)(?=\n\n\*\*|$)/i
    );
    const riskNote = riskNoteMatch ? riskNoteMatch[1].trim() : "";

    const macroSummaryMatch = content.match(
      /\*\*Macro summary:\*\*\s*([\s\S]*?)(?=$)/i
    );
    const macroSummary = macroSummaryMatch ? macroSummaryMatch[1].trim() : "";

    const isLong = direction.toLowerCase().includes("long");
    const directionColor = isLong ? "text-teal-400" : "text-rose-400";
    const directionBg = isLong ? "bg-teal-500/10" : "bg-rose-500/10";
    const directionBorder = isLong
      ? "border-teal-500/20"
      : "border-rose-500/20";

    return (
      <div className="flex flex-col space-y-4 animate-fadeIn">
        {/* Header with direction */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${directionBg} ${directionBorder} border`}
        >
          {isLong ? (
            <ArrowUpCircle className={`h-5 w-5 ${directionColor}`} />
          ) : (
            <ArrowDownCircle className={`h-5 w-5 ${directionColor}`} />
          )}
          <span className={`font-bold text-sm ${directionColor}`}>
            {direction.toUpperCase()} POSITION RECOMMENDATION
          </span>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentPrice && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Current Price</span>
              </div>
              <p className="text-sm font-medium text-white">{currentPrice}</p>
            </div>
          )}

          {entry && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Entry</span>
              </div>
              <p className="text-sm font-medium text-white">{entry}</p>
            </div>
          )}

          {exitTarget && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-teal-500/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-xs text-zinc-400">Exit Target</span>
              </div>
              <p className="text-sm font-medium text-teal-400">{exitTarget}</p>
            </div>
          )}

          {stopLoss && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-rose-500/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-xs text-zinc-400">Stop Loss</span>
              </div>
              <p className="text-sm font-medium text-rose-400">{stopLoss}</p>
            </div>
          )}

          {liquidation && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-amber-500/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-zinc-400">Liquidation</span>
              </div>
              <p className="text-sm font-medium text-amber-400">
                {liquidation}
              </p>
            </div>
          )}
        </div>

        {/* Risk note */}
        {riskNote && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                Risk Analysis
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              {formatTextWithAsterisks(riskNote)}
            </p>
          </div>
        )}

        {/* Macro summary */}
        {macroSummary && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart2 className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-400">
                Macro Summary
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              {formatTextWithAsterisks(macroSummary)}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Format market overview
  const formatMarketOverview = () => {
    // Extract key sections
    const sections = content.split(/\.\s+/);

    // Find interest rates section
    const ratesSection = sections.find(
      (s) =>
        s.toLowerCase().includes("interest rates") ||
        s.toLowerCase().includes("monetary policy")
    );

    // Find crypto indexes section
    const indexesSection = sections.find(
      (s) =>
        s.toLowerCase().includes("crypto indexes") ||
        s.toLowerCase().includes("gmci")
    );

    // Find top coins section
    const topCoinsSection = sections.find(
      (s) =>
        s.toLowerCase().includes("trending") ||
        (s.toLowerCase().includes("top") && s.toLowerCase().includes("coin"))
    );

    // Find general market sentiment
    const sentimentSection = sections.find(
      (s) =>
        s.toLowerCase().includes("risk-on") ||
        s.toLowerCase().includes("risk-off") ||
        s.toLowerCase().includes("bullish") ||
        s.toLowerCase().includes("bearish")
    );

    return (
      <div className="flex flex-col space-y-4 animate-fadeIn">
        {/* Market Overview Header */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <BarChart2 className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-sm text-indigo-400">
            MARKET OVERVIEW
          </span>
        </div>

        {/* Market Sentiment */}
        {sentimentSection && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs text-zinc-400">Market Sentiment</span>
            </div>
            <p className="text-sm text-zinc-300">
              {formatTextWithAsterisks(sentimentSection)}
            </p>
          </div>
        )}

        {/* Interest Rates */}
        {ratesSection && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400">
                Interest Rates & Macro
              </span>
            </div>
            <p className="text-sm text-zinc-300">
              {formatTextWithAsterisks(ratesSection)}
            </p>
          </div>
        )}

        {/* Crypto Indexes */}
        {indexesSection && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-zinc-400">Crypto Indexes</span>
            </div>
            <p className="text-sm text-zinc-300">
              {formatTextWithAsterisks(indexesSection)}
            </p>
          </div>
        )}

        {/* Top Trending Coins */}
        {topCoinsSection && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-zinc-400">Top Trending Coins</span>
            </div>
            <p className="text-sm text-zinc-300">
              {formatTextWithAsterisks(topCoinsSection)}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Determine which formatter to use
  if (isTradingRecommendation) {
    return extractTradingRecommendation();
  } else if (isMarketOverview) {
    return formatMarketOverview();
  } else {
    // Default formatter for regular text
    return (
      <p className="whitespace-pre-wrap text-xs sm:text-sm text-zinc-100 animate-fadeIn">
        {formatTextWithAsterisks(content)}
      </p>
    );
  }
};

export default MessageFormatter;
