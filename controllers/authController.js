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

const isStr = (v) => typeof v === "string";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (
    !isStr(name) || !isStr(email) || !isStr(password) ||
    !name.trim() || name.length > 50 ||
    !emailRe.test(email) ||
    password.length < 6 || password.length > 72
  ) {
    return res.status(400).json({ message: "Valid name, email and password (6-72 chars) required" });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const isAdmin =
    process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const user = await User.create({
    name: name.trim(),
    email,
    password,
    role: isAdmin ? "admin" : "user",
  });
  res.status(201).json({ token: sign(user._id), user: pub(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isStr(email) || !isStr(password)) {
    return res.status(400).json({ message: "Email and password required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: sign(user._id), user: pub(user) });
});

exports.me = (req, res) => res.json(pub(req.user));

exports.updateSettings = asyncHandler(async (req, res) => {
  const { chatbotName, theme } = req.body;
  const user = await User.findById(req.user._id);
  if (isStr(chatbotName) && chatbotName.trim()) {
    user.settings.chatbotName = chatbotName.trim().slice(0, 30);
  }
  if (["light", "dark"].includes(theme)) user.settings.theme = theme;
  await user.save();
  res.json(pub(user));
});