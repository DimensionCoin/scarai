export interface RetestStructure {
  recentPrice: number;
  resistanceLevels: number[];
  volumeAverage: number;
  volumeThreshold: number;
  volumeConfirmations: { [level: number]: boolean };
  entryBreakout: {
    level: number;
    entryZone: string;
  } | null;
  recentBreakoutStrength: number | null;
  priceCompression: boolean;
  priceAcceleration: number | null;
  supportDistance: number | null;
  breakoutVolatility: number | null;
  breakoutAge: number | null;
  falseBreakout: boolean;
  recentRejection: boolean;
  supportStrength: number;
}

function findResistanceLevels(prices: number[][], lookback = 30): number[] {
  const recent = prices.slice(-lookback).map(([, price]) => price);
  const levels: number[] = [];

  for (let i = 2; i < recent.length - 2; i++) {
    const current = recent[i];
    if (
      current > recent[i - 1] &&
      current > recent[i - 2] &&
      current > recent[i + 1] &&
      current > recent[i + 2]
    ) {
      levels.push(current);
    }
  }

  return levels.sort((a, b) => b - a);
}

export function getRetestStructure(
  prices: number[][],
  volumes: number[][],
  lookback: number = 30
): RetestStructure | null {
  if (!prices.length || !volumes.length) return null;

  const recentPrice = prices.at(-1)?.[1];
  if (!recentPrice) return null;

  const resistanceLevels = findResistanceLevels(prices, lookback);
  const volumeAverage =
    volumes.reduce((sum, [, v]) => sum + v, 0) / volumes.length;
  const volumeThreshold = volumeAverage * 1.3;

  const volumeConfirmations: Record<number, boolean> = {};
  resistanceLevels.forEach((level) => {
    const confirmed = prices.some(([, price], i) => {
      const vol = volumes[i]?.[1];
      const closeEnough = Math.abs(price - level) / level < 0.01;
      return closeEnough && vol > volumeThreshold;
    });
    volumeConfirmations[level] = confirmed;
  });

  const validRetests = resistanceLevels.filter(
    (level) => recentPrice > level && volumeConfirmations[level]
  );

  let entryBreakout: RetestStructure["entryBreakout"] = null;
  let breakoutVolatility: number | null = null;
  let breakoutAge: number | null = null;
  let falseBreakout = false;

  if (validRetests.length > 0) {
    const low = Math.min(...validRetests);
    const high = Math.max(...validRetests);
    entryBreakout = {
      level: high,
      entryZone: `$${low.toFixed(2)} – $${high.toFixed(2)}`,
    };

    const breakoutIdx = prices.findIndex(
      ([, p]) => Math.abs(p - high) / high < 0.01
    );
    if (breakoutIdx !== -1) {
      breakoutAge = prices.length - breakoutIdx;
      const preBreakout = prices[breakoutIdx - 1]?.[1];
      if (preBreakout) {
        breakoutVolatility = ((high - preBreakout) / preBreakout) * 100;
        if (recentPrice < high) falseBreakout = true;
      }
    }
  }

  // ⚡ Price Action
  const recentCloses = prices.slice(-6).map(([, price]) => price);
  const priceAcceleration =
    recentCloses.length >= 2
      ? recentCloses.at(-1)! - recentCloses.at(-2)!
      : null;

  const stddev =
    recentCloses.length >= 5
      ? Math.sqrt(
          recentCloses
            .map(
              (p) =>
                p -
                recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length
            )
            .map((diff) => diff ** 2)
            .reduce((a, b) => a + b, 0) / recentCloses.length
        )
      : null;

  const priceCompression =
    stddev !== null && stddev / recentCloses.at(-1)! < 0.002;

  // 🛡️ Support Calculation
  const supportPoints = prices.slice(-lookback).filter((_, i, arr) => {
    const p = arr[i]?.[1];
    const prev = arr[i - 1]?.[1] ?? Infinity;
    const next = arr[i + 1]?.[1] ?? Infinity;
    return p < prev && p < next;
  });

  const supportLevels = supportPoints.map(([, price]) => price);
  const nearestSupport = supportLevels.length
    ? Math.min(...supportLevels)
    : Math.min(...prices.slice(-lookback).map(([, price]) => price));

  const supportDistance = recentPrice - nearestSupport;

  const supportStrength = supportLevels.filter(
    (lvl) => Math.abs(lvl - nearestSupport) / nearestSupport < 0.01
  ).length;

  const breakoutRef = entryBreakout?.level ?? null;
  const recentBreakoutStrength =
    breakoutRef && recentPrice > breakoutRef
      ? ((recentPrice - breakoutRef) / breakoutRef) * 100
      : null;

  const recentRejection: boolean = Boolean(
    resistanceLevels.length &&
      recentPrice < resistanceLevels[0] &&
      volumeConfirmations[resistanceLevels[0]]
  );

  // 🧪 Logs
  console.log("🔎 ENTRY ZONE DEBUG");
  console.log("Prices:", prices.slice(-10));
  console.log("📈 Resistance Levels:", resistanceLevels);
  console.log("📉 Recent Price:", recentPrice.toFixed(2));
  resistanceLevels.forEach((level) => {
    const volConfirmed = volumeConfirmations[level];
    const brokeAbove = recentPrice > level;
    console.log(
      `🧪 Level $${level.toFixed(
        2
      )} | BrokeAbove: ${brokeAbove} | VolumeConfirmed: ${volConfirmed}`
    );
  });

  return {
    recentPrice,
    resistanceLevels,
    volumeAverage,
    volumeThreshold,
    volumeConfirmations,
    entryBreakout,
    recentBreakoutStrength,
    priceCompression,
    priceAcceleration,
    supportDistance,
    breakoutVolatility,
    breakoutAge,
    falseBreakout,
    recentRejection,
    supportStrength,
  };
}
