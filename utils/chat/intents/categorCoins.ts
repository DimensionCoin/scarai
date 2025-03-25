export const categoryCoins = (count: number, category: any) => `-**Intent: category_coins**
- List the top ${count} coins in the matched category: **${
  category?.name ?? "N/A"
}**
- Return each coin on its own line with this format:
  \`<rank>. <name> ($<price>, <24h change>% 24h, Rank: <rank>)\`
- Do NOT summarize — just list the coins as-is unless explicitly asked
`;