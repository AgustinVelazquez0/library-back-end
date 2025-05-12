// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/verifyToken");

// Ruta para obtener todas las reseñas de un libro - no requiere autenticación
router.get("/book/:bookId", reviewController.getBookReviews);

// Rutas que requieren autenticación
router.post("/", verifyToken, reviewController.createReview); // Crear una reseña
router.delete("/:reviewId", verifyToken, reviewController.deleteReview); // Eliminar una reseña
router.put("/:reviewId", verifyToken, reviewController.updateReview); // Actualizar una reseña (opcional)

module.exports = router;
