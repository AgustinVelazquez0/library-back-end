const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/verifyToken");

// Rutas para reseñas
router.post("/", verifyToken, reviewController.createReview); // Crear una reseña
router.get("/book/:bookId", reviewController.getReviewsByBook); // Obtener todas las reseñas de un libro
router.get("/user", verifyToken, reviewController.getReviewsByUser); // Obtener reseñas del usuario autenticado
router.get("/:id", reviewController.getReviewById); // Obtener una reseña específica
router.put("/:id", verifyToken, reviewController.updateReview); // Actualizar una reseña
router.delete("/:id", verifyToken, reviewController.deleteReview); // Eliminar una reseña

module.exports = router;
