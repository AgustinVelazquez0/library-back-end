const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/verifyToken");

// Rutas para reseñas
// La autenticación es opcional para crear reseñas (será anónima si no hay token)
router.post(
  "/",
  (req, res, next) => {
    // Middleware opcional: si hay token, verifica y adjunta usuario, si no, continúa
    if (req.headers.authorization) {
      verifyToken(req, res, next);
    } else {
      next();
    }
  },
  reviewController.createReview
);

// Ver reseñas de un libro (público)
router.get("/:bookId", reviewController.getReviewsByBook);

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
