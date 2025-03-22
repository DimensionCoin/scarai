import { matchCategoryFromQuery } from "@/utils/matchCategory";

export async function useCategoryCoins(userQuery: string, count: number = 25) {
  const category = matchCategoryFromQuery(userQuery);
  if (!category) return { coins: [], category: null };

  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${category.category_id}&order=market_cap_desc&per_page=100&page=1&sparkline=false`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY!,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch coins by category");

  const allCoins = await res.json();

  // Slice the number of coins based on user's request
  return {
    coins: allCoins.slice(0, count),
    category,
  };
}
