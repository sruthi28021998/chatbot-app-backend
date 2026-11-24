const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/chatController");

router.use(auth);
router.post("/message", c.sendMessage);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.put("/:id/rate", c.rate);
router.delete("/:id", c.remove);

module.exports = router;