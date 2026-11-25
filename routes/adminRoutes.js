const User = require("../models/User");
const Conversation = require("../models/Conversation");
const asyncHandler = require("../middleware/asyncHandler");

exports.stats = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [users, conversations, activeUsers, agg, recentUsers] = await Promise.all([
    User.countDocuments(),
    Conversation.countDocuments(),
    Conversation.distinct("user", { updatedAt: { $gte: weekAgo } }),
    Conversation.aggregate([
      { $unwind: "$messages" },
      {
        $group: {
          _id: null,
          messages: { $sum: 1 },
          up: { $sum: { $cond: [{ $eq: ["$messages.rating", 1] }, 1, 0] } },
          down: { $sum: { $cond: [{ $eq: ["$messages.rating", -1] }, 1, 0] } },
          avgResponseMs: { $avg: "$messages.responseMs" },
        },
      },
    ]),
    User.find().sort({ createdAt: -1 }).limit(10).select("name email role createdAt"),
  ]);

  const a = agg[0] || { messages: 0, up: 0, down: 0, avgResponseMs: null };
  res.json({
    users,
    activeUsers: activeUsers.length,
    conversations,
    messages: a.messages,
    thumbsUp: a.up,
    thumbsDown: a.down,
    avgResponseMs: a.avgResponseMs ? Math.round(a.avgResponseMs) : null,
    recentUsers,
  });
});