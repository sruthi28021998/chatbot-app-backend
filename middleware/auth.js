const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    const { id } = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) throw new Error("no user");
    req.user = user;
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
  next();
});