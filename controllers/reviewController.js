// controllers/reviewController.js
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

// Función para crear una nueva reseña
const createReview = async (req, res) => {
  const { bookId, rating, comment } = req.body;

  try {
    // Verificamos que el libro exista
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Creamos la reseña
    const newReview = new Review({
      book: bookId,
      rating,
      comment,
    });

    await newReview.save();

    return res.status(201).json({
      message: "Reseña creada correctamente",
      review: newReview,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
};

// Función para obtener reseñas por libro
const getReviewsByBook = async (req, res) => {
  const { bookId } = req.params;

  try {
    // Buscamos las reseñas del libro
    const reviews = await Review.find({ book: bookId });

    if (!reviews || reviews.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay reseñas para este libro" });
    }

    return res.status(200).json({ reviews });
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviewsByBook,
};
