const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    rating: { type: Number, enum: [-1, 0, 1], default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New chat" },
    category: { type: String, enum: ["casual", "professional", "creative"], default: "casual" },
    messages: [messageSchema],
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);