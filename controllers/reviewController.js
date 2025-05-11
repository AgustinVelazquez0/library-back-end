const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

exports.createReview = async (req, res) => {
  try {
    const { rating, comment, bookId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    // Validar que bookId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "ID de libro no válido" });
    }

    // Buscar el libro por su ObjectId
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Verificar si el usuario ya hizo una reseña para este libro
    const existingReview = await Review.findOne({ bookId, userId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Ya has publicado una reseña para este libro" });
    }

    // Crear la reseña
    const newReview = new Review({
      bookId,
      userId,
      rating,
      comment,
      username,
    });

    await newReview.save();

    res.status(201).json({
      message: "Reseña creada exitosamente",
      review: newReview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear la reseña",
      error: error.message,
    });
  }
};
