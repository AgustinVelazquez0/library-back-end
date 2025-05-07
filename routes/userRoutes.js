// routes/userRoutes.js

const express = require("express");
const { loginUser, registerUser } = require("../controllers/userController");
const authenticateToken = require("../middleware/verifyToken");

const router = express.Router();

// Ruta POST para login
router.post("/login", loginUser); // ✅

router.post("/register", registerUser); // ✅

router.get("/me", authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
  });
});

module.exports = router;
