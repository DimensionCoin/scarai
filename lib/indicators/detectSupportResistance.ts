// lib/coinGecko/detectSupportResistance.ts

export function detectSupportResistance(
  prices: number[][],
  volumes: number[][]
): {
  supportLevels: number[];
  resistanceLevels: number[];
} {
  const pricePoints = prices.map(([, price]) => price);
  const volumeMap = new Map<number, number>();
  const threshold = 0.02; // 2% similarity threshold to cluster price zones

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i][1];
    const volume = volumes[i]?.[1] ?? 0;

    const rounded = parseFloat(price.toFixed(2));
    const existing = [...volumeMap.keys()].find(
      (key) => Math.abs(key - rounded) / key < threshold
    );

    if (existing !== undefined) {
      volumeMap.set(existing, volumeMap.get(existing)! + volume);
    } else {
      volumeMap.set(rounded, volume);
    }
  }

  const sorted = [...volumeMap.entries()].sort((a, b) => b[1] - a[1]);
  const topZones = sorted.slice(0, 10).map(([price]) => price);

  const maxPrice = Math.max(...pricePoints);
  const minPrice = Math.min(...pricePoints);
  const midpoint = (maxPrice + minPrice) / 2;

  const supportLevels = topZones
    .filter((p) => p < midpoint)
    .sort((a, b) => b - a)
    .slice(0, 3);

  const resistanceLevels = topZones
    .filter((p) => p > midpoint)
    .sort((a, b) => a - b)
    .slice(0, 3);

  return {
    supportLevels,
    resistanceLevels,
  };
}
