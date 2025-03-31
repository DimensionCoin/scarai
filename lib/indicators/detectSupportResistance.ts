// ./lib/indicators/detectSupportResistance.ts

export type SRLevel = {
  price: number;
  strength: "strong" | "moderate" | "weak";
};

export function detectSupportResistance(
  prices: number[][],
  volumes: number[][]
): {
  supportLevels: SRLevel[];
  resistanceLevels: SRLevel[];
} {
  const pricePoints = prices.map(([, p]) => p);
  const volumePoints = volumes.map(([, v]) => v);
  const now = prices.at(-1)?.[0] ?? Date.now();
  const recentCutoff = now - 7 * 24 * 60 * 60 * 1000;

  const range = Math.max(...pricePoints) - Math.min(...pricePoints);
  const clusteringThreshold = range * 0.01; // dynamic bucket size (~1% of price range)
  const volumeMap = new Map<number, number>();

  for (let i = 0; i < prices.length; i++) {
    const [timestamp, price] = prices[i];
    const volume = volumePoints[i] ?? 0;

    const adjustedVolume = timestamp >= recentCutoff ? volume * 1.5 : volume;
    const bucket = Array.from(volumeMap.keys()).find(
      (key) => Math.abs(price - key) <= clusteringThreshold
    );

    if (bucket !== undefined) {
      volumeMap.set(bucket, volumeMap.get(bucket)! + adjustedVolume);
    } else {
      volumeMap.set(price, adjustedVolume);
    }
  }

  // Normalize volume weights
  const sortedZones = [...volumeMap.entries()]
    .map(([price, weight]) => ({ price, weight }))
    .sort((a, b) => b.weight - a.weight);

  const maxWeight = sortedZones[0]?.weight ?? 1;
  const midpoint = (Math.max(...pricePoints) + Math.min(...pricePoints)) / 2;

  const classifyStrength = (w: number): "strong" | "moderate" | "weak" => {
    const ratio = w / maxWeight;
    if (ratio > 0.7) return "strong";
    if (ratio > 0.4) return "moderate";
    return "weak";
  };

  const supportLevels: SRLevel[] = [];
  const resistanceLevels: SRLevel[] = [];

  for (const { price, weight } of sortedZones) {
    const strength = classifyStrength(weight);
    if (price < midpoint) supportLevels.push({ price, strength });
    else resistanceLevels.push({ price, strength });
  }

  return {
    supportLevels: supportLevels.sort((a, b) => b.price - a.price),
    resistanceLevels: resistanceLevels.sort((a, b) => a.price - b.price),
  };
}
