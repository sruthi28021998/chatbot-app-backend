require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "10kb" }));

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { message: "Too many requests, try again later" } }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: "Too many attempts, try again later" } }));
app.use("/api/chat/message", rateLimit({ windowMs: 60 * 1000, max: 20, message: { message: "Too many messages. Please slow down." } }));

app.get("/", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid ID" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON" });
  res.status(500).json({ message: "Server error" });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });
require("./sockets/chatSocket")(io);

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);