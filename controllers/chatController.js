const Conversation = require("../models/Conversation");
const asyncHandler = require("../middleware/asyncHandler");
const { getAIResponse } = require("../services/aiService");

const CATEGORIES = ["casual", "professional", "creative"];

exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, category } = req.body;
  if (!content || !content.trim() || content.length > 2000) {
    return res.status(400).json({ message: "Message must be 1-2000 characters" });
  }

  let convo = conversationId
    ? await Conversation.findOne({ _id: conversationId, user: req.user._id })
    : null;
  if (!convo) {
    convo = new Conversation({
      user: req.user._id,
      title: content.trim().slice(0, 40),
      category: CATEGORIES.includes(category) ? category : "casual",
    });
  }

  convo.messages.push({ role: "user", content: content.trim() });
  const history = convo.messages
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  let reply;
  try {
    reply = await getAIResponse(history, convo.category);
  } catch (e) {
    console.error("AI error:", e.message);
    return res.status(e.status === 429 ? 429 : 502).json({
      message:
        e.status === 429
          ? "AI is busy or quota exceeded. Please try again shortly."
          : "AI service failed. Please try again.",
    });
  }

  convo.messages.push({ role: "assistant", content: reply });
  await convo.save();

  res.json({
    conversationId: convo._id,
    message: convo.messages[convo.messages.length - 1],
  });
});

exports.list = asyncHandler(async (req, res) => {
  const items = await Conversation.find({ user: req.user._id })
    .select("title category updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  res.json(items);
});

exports.getOne = asyncHandler(async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!convo) return res.status(404).json({ message: "Conversation not found" });
  res.json(convo);
});

exports.remove = asyncHandler(async (req, res) => {
  await Conversation.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ ok: true });
});

exports.rate = asyncHandler(async (req, res) => {
  const { messageId, rating } = req.body;
  if (![1, -1, 0].includes(rating)) {
    return res.status(400).json({ message: "Invalid rating" });
  }
  const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  const msg = convo && convo.messages.id(messageId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  msg.rating = rating;
  await convo.save();
  res.json({ ok: true });
});