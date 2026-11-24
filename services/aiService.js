const OpenAI = require("openai");
const NodeCache = require("node-cache");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cache = new NodeCache({ stdTTL: 600, maxKeys: 500 });

const prompts = {
  casual: "You are a friendly, casual assistant. Keep replies conversational.",
  professional: "You are a professional assistant. Be precise, formal and concise.",
  creative: "You are a creative assistant. Be imaginative and expressive.",
};

exports.getAIResponse = async (history, category = "casual") => {
  const key =
    history.length === 1 ? `${category}:${history[0].content.toLowerCase()}` : null;
  if (key && cache.has(key)) return cache.get(key);

  const completion = await client.chat.completions.create(
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompts[category] || prompts.casual },
        ...history,
      ],
      max_tokens: 800,
    },
    { timeout: 30000 }
  );

  const reply = completion.choices[0].message.content;
  if (key) cache.set(key, reply);
  return reply;
};