const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/authController");

router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", auth, c.me);
router.put("/settings", auth, c.updateSettings);
module.exports = router;