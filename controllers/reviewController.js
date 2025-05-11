// controllers/reviewController.js
const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

exports.createReview = async (req, res) => {
  try {
    const { bookId, rating, comment, userId } = req.body;

    console.log("Datos recibidos para reseña:", { bookId, rating, comment });

    if (bookId === undefined || bookId === null) {
      return res.status(400).json({ message: "Se requiere el ID del libro" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "La puntuación debe estar entre 1 y 5" });
    }

    // 🔥 NUEVA BÚSQUEDA: solo por numericId
    const numericId = parseInt(bookId);
    const book = await Book.findOne({ numericId });

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    console.log(
      "ÉXITO: Libro encontrado:",
      book.title,
      "con numericId:",
      numericId
    );

    const newReview = new Review({
      book: book._id,
      rating: parseInt(rating),
      comment,
      userId: "anonymous", // dejalo así por ahora
    });

    const savedReview = await newReview.save();
    console.log("Reseña creada con éxito, ID:", savedReview._id);

    // Recalcular puntuación promedio
    const reviews = await Review.find({ book: book._id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    book.rating = parseFloat(averageRating.toFixed(1));
    await book.save();

    res.status(201).json({
      message: "Reseña creada con éxito",
      review: savedReview,
      bookTitle: book.title,
      newRating: book.rating,
    });
  } catch (error) {
    console.error("Error al crear la reseña:", error);
    res.status(500).json({
      message: "Error al crear la reseña",
      error: error.message,
    });
  }
};

// Obtener reseñas por libro usando numericId
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const numericId = parseInt(bookId);
    const book = await Book.findOne({ numericId });

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    const reviews = await Review.find({ book: book._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas por libro:", error);
    res.status(500).json({
      message: "Error al obtener las reseñas del libro",
      error: error.message,
    });
  }
};
