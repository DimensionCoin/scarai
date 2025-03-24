import type React from "react";
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
} from "lucide-react";

interface TradingRecommendationProps {
  content: string;
}

const TradingRecommendation: React.FC<TradingRecommendationProps> = ({
  content,
}) => {
  // Check if the content matches the trading recommendation format
  const isTradingRecommendation =
    content.includes("**Direction:") &&
    (content.includes("**Current Price:") || content.includes("**Entry:"));

  if (!isTradingRecommendation) {
    // Return regular content if not a trading recommendation
    return (
      <p className="whitespace-pre-wrap text-xs sm:text-sm text-zinc-100">
        {content}
      </p>
    );
  }

  // Extract key information using regex
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

  // Extract risk note and macro summary - these need special handling due to their format
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
  const directionBorder = isLong ? "border-teal-500/20" : "border-rose-500/20";

  return (
    <div className="flex flex-col space-y-4">
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
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400">Current Price</span>
            </div>
            <p className="text-sm font-medium text-white">{currentPrice}</p>
          </div>
        )}

        {entry && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400">Entry</span>
            </div>
            <p className="text-sm font-medium text-white">{entry}</p>
          </div>
        )}

        {exitTarget && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-zinc-400">Exit Target</span>
            </div>
            <p className="text-sm font-medium text-teal-400">{exitTarget}</p>
          </div>
        )}

        {stopLoss && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs text-zinc-400">Stop Loss</span>
            </div>
            <p className="text-sm font-medium text-rose-400">{stopLoss}</p>
          </div>
        )}

        {liquidation && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-zinc-400">Liquidation</span>
            </div>
            <p className="text-sm font-medium text-amber-400">{liquidation}</p>
          </div>
        )}
      </div>

      {/* Risk note */}
      {riskNote && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Risk Analysis
            </span>
          </div>
          <p className="text-xs text-zinc-300">{riskNote}</p>
        </div>
      )}

      {/* Macro summary */}
      {macroSummary && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">
              Macro Summary
            </span>
          </div>
          <p className="text-xs text-zinc-300">{macroSummary}</p>
        </div>
      )}
    </div>
  );
};

export default TradingRecommendation;
