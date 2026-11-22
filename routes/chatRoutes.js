const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/chatController");

router.post("/message", auth, c.sendMessage);

module.exports = router;