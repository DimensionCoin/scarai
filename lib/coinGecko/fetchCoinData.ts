import { fetchWithRetry } from "@/utils/fetchWithRetry";

export async function fetchCoinData(tickers: string[]): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  const results: string[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i].replace("/", "").toLowerCase();
    await new Promise((r) => setTimeout(r, i * 1500));

    try {
      const res = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/coins/${ticker}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        {
          headers: {
            accept: "application/json",
            ...(apiKey && { x_cg_demo_api_key: apiKey }),
          },
        }
      );

      const data = await res.json();
      const market = data.market_data;

      const block = `
${data.name.toUpperCase()}
Price: $${market.current_price?.usd ?? "N/A"}
Change: 24h ${market.price_change_percentage_24h?.toFixed(2) ?? "N/A"}%, 7d ${
        market.price_change_percentage_7d?.toFixed(2) ?? "N/A"
      }%, 30d ${market.price_change_percentage_30d?.toFixed(2) ?? "N/A"}%
Rank: #${data.market_cap_rank ?? "N/A"}
Market Cap: $${market.market_cap?.usd?.toLocaleString() ?? "N/A"}
Volume (24h): $${market.total_volume?.usd?.toLocaleString() ?? "N/A"}
ATH: $${market.ath?.usd ?? "N/A"} on ${
        market.ath_date?.usd?.split("T")[0] ?? "N/A"
      }
ATL: $${market.atl?.usd ?? "N/A"} on ${
        market.atl_date?.usd?.split("T")[0] ?? "N/A"
      }
Description: ${data.description?.en?.split(".")[0] ?? "N/A"}
Twitter: https://twitter.com/${data.links?.twitter_screen_name ?? ""}
Reddit: ${data.links?.subreddit_url ?? "N/A"}
GitHub: ${data.links?.repos_url?.github?.[0] ?? "N/A"}
      `.trim();

      results.push(block);
    } catch (err) {
      console.error(`❌ Failed to fetch data for ${ticker}`, err);
      results.push(`${ticker.toUpperCase()}: Unable to fetch data.`);
    }
  }

  return results.join("\n\n");
}
