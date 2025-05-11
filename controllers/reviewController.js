// controllers/reviewController.js
const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

exports.createReview = async (req, res) => {
  try {
    const { bookId, rating, comment, userId } = req.body;

    console.log("Datos recibidos para reseña:", { bookId, rating, comment });

    // Verificar que el ID del libro esté presente
    if (bookId === undefined || bookId === null) {
      return res.status(400).json({ message: "Se requiere el ID del libro" });
    }

    // Verificar que la puntuación esté entre 1 y 5
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "La puntuación debe estar entre 1 y 5" });
    }

    // 🔥 NUEVA BÚSQUEDA: Buscar solo por numericId
    const numericId = parseInt(bookId);

    // Si el numericId no es válido, devolver error
    if (isNaN(numericId)) {
      return res.status(400).json({ message: "El ID del libro no es válido" });
    }

    // Buscar el libro con el numericId
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

    // Crear la nueva reseña
    const newReview = new Review({
      book: book._id,
      rating: parseInt(rating),
      comment,
      userId: "anonymous", // Dejamos el userId como "anonymous" por ahora
    });

    const savedReview = await newReview.save();
    console.log("Reseña creada con éxito, ID:", savedReview._id);

    // Recalcular la puntuación promedio del libro
    const reviews = await Review.find({ book: book._id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Guardar la nueva puntuación promedio en el libro
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

    // Convertir bookId a numericId
    const numericId = parseInt(bookId);

    // Si el numericId no es válido, devolver error
    if (isNaN(numericId)) {
      return res.status(400).json({ message: "El ID del libro no es válido" });
    }

    // Buscar el libro con el numericId
    const book = await Book.findOne({ numericId });

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Obtener las reseñas del libro
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
