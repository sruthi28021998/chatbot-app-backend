const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const pub = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  settings: u.settings,
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: "Name, email and password (min 6 chars) required" });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user._id), user: pub(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password || ""))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: sign(user._id), user: pub(user) });
});

exports.me = (req, res) => res.json(pub(req.user));