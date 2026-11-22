const Conversation = require("../models/Conversation");
const asyncHandler = require("../middleware/asyncHandler");
const { getAIResponse } = require("../services/aiService");

exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content } = req.body;
  if (!content || !content.trim() || content.length > 2000) {
    return res.status(400).json({ message: "Message must be 1-2000 characters" });
  }

  let convo = conversationId
    ? await Conversation.findOne({ _id: conversationId, user: req.user._id })
    : null;
  if (!convo) {
    convo = new Conversation({ user: req.user._id, title: content.trim().slice(0, 40) });
  }

  convo.messages.push({ role: "user", content: content.trim() });
  const history = convo.messages
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  const reply = await getAIResponse(history);
  convo.messages.push({ role: "assistant", content: reply });
  await convo.save();

  res.json({
    conversationId: convo._id,
    message: convo.messages[convo.messages.length - 1],
  });
});