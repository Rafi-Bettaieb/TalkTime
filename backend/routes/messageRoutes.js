const express = require("express");
const { allMessages, sendMessage } = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let format = undefined;
    if (file.mimetype === "application/pdf") {
      format = "pdf";
    }

    return {
      folder: "talktime_uploads",
      resource_type: "auto", 
      format: format, 
    };
  },
});

const upload = multer({ storage: storage });

router.route("/:chatId").get(protect, allMessages);

router.post("/", protect, (req, res, next) => {
    upload.single("file")(req, res, function (err) {
        if (err) {
            console.error("UPLOAD ERROR:", err);
            return res.status(500).json({ message: "Upload failed", error: err.message });
        }
        next();
    });
}, sendMessage);

module.exports = router;