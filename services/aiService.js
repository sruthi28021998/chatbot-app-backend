const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompts = {
  casual: "You are a friendly, casual assistant. Keep replies conversational.",
  professional: "You are a professional assistant. Be precise, formal and concise.",
  creative: "You are a creative assistant. Be imaginative and expressive.",
};

exports.getAIResponse = async (history, category = "casual") => {
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
  return completion.choices[0].message.content;
};