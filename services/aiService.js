const OpenAI = require("openai");
const NodeCache = require("node-cache");

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing in .env");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || undefined,
  maxRetries: 0,
});
const cache = new NodeCache({ stdTTL: 600, maxKeys: 500 });

const prompts = {
  casual: "You are a friendly, casual assistant. Keep replies conversational.",
  professional: "You are a professional assistant. Be precise, formal and concise.",
  creative: "You are a creative assistant. Be imaginative and expressive.",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.getAIResponse = async (history, category = "casual") => {
  const key =
    history.length === 1 ? `${category}:${history[0].content.toLowerCase()}` : null;
  if (key && cache.has(key)) return cache.get(key);

  const messages = [
    { role: "system", content: prompts[category] || prompts.casual },
    ...history,
  ];
  const models = [process.env.AI_MODEL || "gpt-4o-mini", process.env.AI_FALLBACK_MODEL].filter(Boolean);

  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const completion = await client.chat.completions.create(
          { model, messages, max_tokens: 2000 },
          { timeout: 30000 }
        );
        const reply = completion.choices[0].message.content;
        if (key) cache.set(key, reply);
        return reply;
      } catch (e) {
        lastErr = e;
        console.error(`AI error (${model}, try ${attempt + 1}):`, e.status, e.message);
        if (![500, 502, 503, 504].includes(e.status)) break;
        await wait(1500 * (attempt + 1));
      }
    }
  }
  throw lastErr;
};