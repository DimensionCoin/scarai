"use client";

import React from "react";
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
  const isTradingRecommendation =
    content.includes("**Direction:") && content.includes("**Current Price:");

  const isMarketOverview =
    content.includes("crypto markets") &&
    (content.includes("trending") || content.includes("gain")) &&
    !isTradingRecommendation;

  const formatTextWithAsterisks = (text: string): React.ReactNode[] => {
    if (!text) return [text];
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const content = part.slice(2, -2);
        return (
          <span key={index} className="font-semibold text-teal-400">
            {content}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const extractField = (label: string) => {
    const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i");
    const match = content.match(regex);
    return match?.[1]?.trim() ?? "";
  };

  const extractTradingRecommendation = () => {
    const direction = extractField("Direction");
    const currentPrice = extractField("Current Price");
    const entry = extractField("Entry");
    const exitTarget = extractField("Exit Target");
    const stopLoss = extractField("Stop-loss");
    const liquidation = extractField("Liquidation");
    const riskNote = extractField("Risk Note");
    const macroSummary = extractField("Macro Summary");

    const isLong = direction.toLowerCase().includes("long");
    const isShort = direction.toLowerCase().includes("short");

    const directionColor = isLong
      ? "text-teal-400"
      : isShort
      ? "text-rose-400"
      : "text-yellow-400";
    const directionBg = isLong
      ? "bg-teal-500/10"
      : isShort
      ? "bg-rose-500/10"
      : "bg-yellow-500/10";
    const directionBorder = isLong
      ? "border-teal-500/20"
      : isShort
      ? "border-rose-500/20"
      : "border-yellow-500/20";

    return (
      <div className="flex flex-col space-y-4 animate-fadeIn">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${directionBg} ${directionBorder} border`}
        >
          {isLong ? (
            <ArrowUpCircle className={`h-5 w-5 ${directionColor}`} />
          ) : isShort ? (
            <ArrowDownCircle className={`h-5 w-5 ${directionColor}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 ${directionColor}`} />
          )}
          <span className={`font-bold text-sm ${directionColor}`}>
            {direction.toUpperCase()} POSITION RECOMMENDATION
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentPrice && (
            <InfoBlock
              icon={DollarSign}
              label="Current Price"
              value={currentPrice}
            />
          )}
          {entry && <InfoBlock icon={TrendingUp} label="Entry" value={entry} />}
          {exitTarget && (
            <InfoBlock
              icon={Target}
              label="Exit Target"
              value={exitTarget}
              color="text-teal-400"
            />
          )}
          {stopLoss && (
            <InfoBlock
              icon={Shield}
              label="Stop-loss"
              value={stopLoss}
              color="text-rose-400"
            />
          )}
          {liquidation && (
            <InfoBlock
              icon={AlertTriangle}
              label="Liquidation"
              value={liquidation}
              color="text-amber-400"
            />
          )}
        </div>

        {riskNote && (
          <InfoSection
            icon={Zap}
            title="Risk Analysis"
            value={riskNote}
            color="text-amber-400"
          />
        )}

        {macroSummary && (
          <InfoSection
            icon={BarChart2}
            title="Macro Summary"
            value={macroSummary}
            color="text-indigo-400"
          />
        )}
      </div>
    );
  };

  const formatMarketOverview = () => {
    const sections = content.split(/\.\s+/);

    const findSection = (...keywords: string[]) =>
      sections.find((s) =>
        keywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase()))
      );

    const sentiment = findSection("bullish", "bearish", "risk-on", "risk-off");
    const rates = findSection("interest rates", "monetary policy");
    const indexes = findSection("gmci", "crypto indexes");
    const topCoins = findSection("top", "trending");

    return (
      <div className="flex flex-col space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <BarChart2 className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-sm text-indigo-400">
            MARKET OVERVIEW
          </span>
        </div>

        {sentiment && (
          <InfoSection
            icon={Info}
            title="Market Sentiment"
            value={sentiment}
            color="text-indigo-400"
          />
        )}
        {rates && (
          <InfoSection
            icon={Percent}
            title="Interest Rates & Macro"
            value={rates}
          />
        )}
        {indexes && (
          <InfoSection
            icon={TrendingUp}
            title="Crypto Indexes"
            value={indexes}
            color="text-teal-400"
          />
        )}
        {topCoins && (
          <InfoSection
            icon={Coins}
            title="Top Trending Coins"
            value={topCoins}
            color="text-amber-400"
          />
        )}
      </div>
    );
  };

  if (isTradingRecommendation) return extractTradingRecommendation();
  if (isMarketOverview) return formatMarketOverview();

  return (
    <p className="whitespace-pre-wrap text-xs sm:text-sm text-zinc-100 animate-fadeIn">
      {formatTextWithAsterisks(content)}
    </p>
  );
};

// Reusable info box components
const InfoBlock = ({
  icon: Icon,
  label,
  value,
  color = "text-white",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="h-3.5 w-3.5 text-zinc-400" />
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
    <p className={`text-sm font-medium ${color}`}>{value}</p>
  </div>
);

const InfoSection = ({
  icon: Icon,
  title,
  value,
  color = "text-zinc-300",
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  color?: string;
}) => (
  <div className="bg-black/20 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors">
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{title}</span>
    </div>
    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{value}</p>
  </div>
);

export default MessageFormatter;
