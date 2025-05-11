// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/verifyToken"); // Si usas autenticación

// Rutas para reseñas
router.post("/", reviewController.createReview); // Crea una reseña
router.get("/book/:bookId", reviewController.getReviewsByBook); // Obtiene reseñas por libro

// Las siguientes rutas requieren autenticación
router.get("/user", verifyToken, (req, res) => {
  // Placeholder hasta implementar la funcionalidad
  res.status(501).json({ message: "Funcionalidad no implementada" });
});

// Las siguientes rutas están comentadas porque aún no están implementadas
// router.get("/", reviewController.getAllReviews);
// router.get("/:id", reviewController.getReviewById);
// router.put("/:id", verifyToken, reviewController.updateReview);
// router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
