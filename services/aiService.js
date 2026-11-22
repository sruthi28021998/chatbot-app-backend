const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.getAIResponse = async (history) => {
  const completion = await client.chat.completions.create(
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful, friendly AI assistant." },
        ...history,
      ],
      max_tokens: 800,
    },
    { timeout: 30000 }
  );
  return completion.choices[0].message.content;
};