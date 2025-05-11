const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/verifyToken");

// Rutas para reseñas existentes
router.post("/", reviewController.createReview);
router.get("/:bookId", reviewController.getReviewsByBook);

// router.get("/", reviewController.getAllReviews);
// Las siguientes rutas están comentadas porque aún no están implementadas
// router.get("/user", verifyToken, reviewController.getReviewsByUser);
// router.get("/:id", reviewController.getReviewById);
// router.put("/:id", verifyToken, reviewController.updateReview);
// router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
