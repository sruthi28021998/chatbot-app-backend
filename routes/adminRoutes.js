const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/adminController");

router.get("/stats", auth, admin, c.stats);

module.exports = router;