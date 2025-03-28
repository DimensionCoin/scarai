import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: "https://api.x.ai/v1", // Grok uses this base URL
});

interface GrokInput {
  systemPrompt: string; // contains intent rules
  context: string; // parsed summary of user question
  data: string; // fetched data, formatted and ready for Grok
}

export async function callGrok({ systemPrompt, context, data }: GrokInput) {
  const fullPrompt = `
${systemPrompt}

---

${data}
  `.trim();

  console.log("=======================================");
  console.log("🧠 SYSTEM PROMPT:\n", fullPrompt);
  console.log("🗣️ USER CONTEXT:\n", context);
  console.log("=======================================");


  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      { role: "system", content: fullPrompt },
      { role: "user", content: context },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return (
    completion.choices?.[0]?.message?.content ?? "⚠️ No response from Grok."
  );
}
