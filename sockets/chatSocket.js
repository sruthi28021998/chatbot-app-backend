const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");
const { getAIResponse } = require("../services/aiService");

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

    socket.on("send_message", async ({ conversationId, content }) => {
      try {
        const now = Date.now();
        if (now - last < 1000) {
          return socket.emit("chat_error", "You are sending messages too fast.");
        }
        last = now;

        if (!content || !content.trim() || content.length > 2000) {
          return socket.emit("chat_error", "Message must be 1-2000 characters.");
        }

        let convo = conversationId
          ? await Conversation.findOne({ _id: conversationId, user: socket.userId })
          : null;
        if (!convo) {
          convo = new Conversation({ user: socket.userId, title: content.trim().slice(0, 40) });
        }

        convo.messages.push({ role: "user", content: content.trim() });
        const history = convo.messages
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const reply = await getAIResponse(history);
        convo.messages.push({ role: "assistant", content: reply });
        await convo.save();

        socket.emit("ai_message", {
          conversationId: convo._id,
          message: convo.messages[convo.messages.length - 1],
        });
      } catch (e) {
        console.error("Socket error:", e.message);
        socket.emit("chat_error", "AI is unavailable right now. Please try again.");
      }
    });
  });
};