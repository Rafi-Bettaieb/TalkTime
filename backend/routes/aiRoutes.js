const express = require("express");
const { generateSuggestions } = require("../controllers/aiControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/suggest").post(protect, generateSuggestions);

module.exports = router;