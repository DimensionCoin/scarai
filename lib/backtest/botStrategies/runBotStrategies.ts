import { parseIndicatorsFromText } from "./utils/parseIndicatorsFromText";
import { macdBotSignal } from "./macdBotSignal";
import { rsiBotSignal } from "./rsiBotSignal";
import { breakoutBotSignal } from "./breakoutBotSignal";
import { BotIndicatorData } from "./types";

/**
 * Extracts bot-readable indicators from the technical analysis section
 * and runs MACD, RSI, and Breakout strategies.
 *
 * Returns a formatted markdown block of strategy views.
 */
export function runBotStrategies(technicalText: string): string {
  let indicators: BotIndicatorData;

  try {
    indicators = parseIndicatorsFromText(technicalText);
  } catch (err) {
    console.error("❌ Failed to parse indicators from text:", err);
    return `### Strategy Views\n- Unable to analyze strategy signals.`;
  }

  const signals = [
    macdBotSignal(indicators),
    rsiBotSignal(indicators),
    breakoutBotSignal(indicators),
  ];

  return `### Strategy Views\n${signals.join("\n")}`;
}
