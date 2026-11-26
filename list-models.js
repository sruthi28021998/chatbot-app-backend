require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

client.models
  .list()
  .then(async (page) => {
    for await (const m of page) console.log(m.id);
  })
  .catch((e) => console.error(e.status, e.message));