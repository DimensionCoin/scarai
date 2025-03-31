import OpenAI from "openai";
import Category from "@/models/category.model";
import { connect } from "@/db";

export async function matchCategory(userInput: string): Promise<string | null> {
  await connect();
  const categories = await Category.find().lean();

  if (!categories?.length) {
    console.warn("⚠️ No categories found in database.");
    return null;
  }

  const categoryList = categories.map((c) => ({
    id: c.category_id,
    name: c.name,
  }));

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: "https://api.deepseek.com",
  });

  const systemPrompt = `
You are a smart fuzzy matcher for crypto coin categories.
Given a user input like "ai agent coins", return the MOST relevant category_id from the list below.

Only return a valid \`category_id\` from the list — do NOT guess or make one up.

Return only the \`category_id\` string and nothing else.

List of available categories:
${categoryList.map((c) => `- ${c.name} → ${c.id}`).join("\n")}
`;

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
    max_tokens: 50,
    temperature: 0.1,
  });

  const match = completion.choices?.[0]?.message?.content?.trim();
  const valid = categoryList.find((c) => c.id === match);
  return valid ? valid.id : null;
}
