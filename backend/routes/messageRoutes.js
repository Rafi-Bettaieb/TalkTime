const express = require("express");
const { allMessages, sendMessage } = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)){
    console.log("Dossier 'uploads' introuvable. Création à :", uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.route("/:chatId").get(protect, allMessages);

router.post("/", protect, (req, res, next) => {
    upload.single("file")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("ERREUR MULTER:", err);
            return res.status(500).json({ message: "Erreur Multer lors de l'upload", error: err.message });
        } else if (err) {
            console.error("ERREUR UPLOAD INCONNUE:", err);
            return res.status(500).json({ message: "Erreur serveur lors de l'upload", error: err.message });
        }
        next();
    });
}, sendMessage);

module.exports = router;