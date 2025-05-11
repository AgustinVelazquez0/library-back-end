const express = require("express");
const router = express.Router();
// const { ObjectId } = require("mongodb"); // Ya no necesitamos esto aquí

const Review = require("./reviewModel");
const Book = require("./models/bookModel");

// Importar el controlador de reseñas
const reviewController = require("../controllers/reviewController");

// POST /api/reviews
// Comentar esta parte ya que la lógica está en reviewController.js
// router.post("/", async (req, res) => {
//   const { bookId, rating, comment } = req.body;
//
//   if (!ObjectId.isValid(bookId)) {
//     return res.status(400).json({ message: "ID de libro inválido" });
//   }
//
//   try {
//     const book = await Book.findById(bookId);
//     if (!book) {
//       return res.status(404).json({ message: "Libro no encontrado" });
//     }
//
//     const newReview = new Review({
//       book: bookId,
//       rating,
//       comment,
//     });
//
//     await newReview.save();
//
//     res
//       .status(201)
//       .json({ message: "Reseña creada correctamente", review: newReview });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error del servidor", error: error.message });
//   }
// });

// Usar el controlador para manejar la ruta POST
router.post("/", reviewController.createReview);

// Asegúrate de que las otras rutas también usen el controlador adecuado
router.get("/:bookId", reviewController.getReviewsByBook);

module.exports = router;
