const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const { getAIResponse } = require("../services/aiService");

const CATEGORIES = ["casual", "professional", "creative"];

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (e) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    let last = 0;

    socket.on("send_message", async ({ conversationId, content, category }) => {
      try {
        const now = Date.now();
        if (now - last < 1000) {
          return socket.emit("chat_error", "You are sending messages too fast.");
        }
        last = now;

        if (typeof content !== "string" || !content.trim() || content.length > 2000) {
          return socket.emit("chat_error", "Message must be 1-2000 characters.");
        }

        let convo = conversationId
          ? await Conversation.findOne({ _id: conversationId, user: socket.userId })
          : null;
        if (!convo) {
          convo = new Conversation({
            user: socket.userId,
            title: content.trim().slice(0, 40),
            category: CATEGORIES.includes(category) ? category : "casual",
          });
        }

        convo.messages.push({ role: "user", content: content.trim() });
        const history = convo.messages
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const started = Date.now();
        const reply = await getAIResponse(history, convo.category);
        convo.messages.push({ role: "assistant", content: reply, responseMs: Date.now() - started });
        await convo.save();

        socket.emit("ai_message", {
          conversationId: convo._id,
          message: convo.messages[convo.messages.length - 1],
        });
      } catch (e) {
        console.error("Socket error:", e.status, e.message);
        let msg = "AI is unavailable right now. Please try again.";
        if (e.status === 429) msg = "AI is busy or quota exceeded. Please try again shortly.";
        if (e.status === 503) msg = "AI is overloaded right now. Please try again in a few seconds.";
        if (e.status === 404) msg = "AI model not found. Check AI_MODEL on the server.";
        socket.emit("chat_error", msg);
      }
    });
  });
};