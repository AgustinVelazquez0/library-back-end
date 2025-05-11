// controllers/reviewController.js
const mongoose = require("mongoose");
const Book = require("../models/Book");
const Review = require("../models/Review"); // Asegúrate de tener este modelo

exports.createReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;

    console.log("Datos recibidos para reseña:", { bookId, rating, comment });
    console.log("Tipo de bookId:", typeof bookId, "Valor:", bookId);

    // Validaciones básicas
    if (bookId === undefined || bookId === null) {
      return res.status(400).json({ message: "Se requiere el ID del libro" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "La puntuación debe estar entre 1 y 5" });
    }

    // Buscar el libro utilizando múltiples estrategias
    let book = null;

    // 1. Si es un ObjectId válido, intentar buscar por _id
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      console.log("Intentando buscar libro por ObjectId:", bookId);
      book = await Book.findById(bookId);
      console.log(
        "Resultado de búsqueda por ObjectId:",
        book ? "Encontrado" : "No encontrado"
      );
    }

    // 2. Si es un número o string numérico, intentar buscar por numericId
    if (!book && (typeof bookId === "number" || !isNaN(parseInt(bookId)))) {
      const numId = parseInt(bookId);
      console.log("Intentando buscar libro por numericId:", numId);
      book = await Book.findOne({ numericId: numId });
      console.log(
        "Resultado de búsqueda por numericId:",
        book ? "Encontrado" : "No encontrado"
      );
    }

    // Si aún no se encuentra el libro, probar con el campo id por si acaso
    if (!book && (typeof bookId === "number" || !isNaN(parseInt(bookId)))) {
      const numId = parseInt(bookId);
      console.log("Intentando buscar libro por campo id:", numId);
      book = await Book.findOne({ id: numId });
      console.log(
        "Resultado de búsqueda por id:",
        book ? "Encontrado" : "No encontrado"
      );
    }

    // Si no se encuentra el libro con ningún método
    if (!book) {
      console.log("ERROR: Libro no encontrado para ID:", bookId);
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    console.log("ÉXITO: Libro encontrado:", book.title, "con _id:", book._id);

    // Crear la reseña
    const newReview = new Review({
      book: book._id, // Usamos el ObjectId de MongoDB
      rating: parseInt(rating),
      comment,
    });

    const savedReview = await newReview.save();
    console.log("Reseña creada con éxito, ID:", savedReview._id);

    // Actualizar la puntuación promedio del libro
    const reviews = await Review.find({ book: book._id });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    book.rating = parseFloat(averageRating.toFixed(1));
    await book.save();
    console.log("Puntuación del libro actualizada a:", book.rating);

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

// Obtener todas las reseñas
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({
      message: "Error al obtener las reseñas",
      error: error.message,
    });
  }
};

// Obtener reseñas por libro
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    let book = null;

    // Buscar el libro utilizando múltiples estrategias (similar a createReview)
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      book = await Book.findById(bookId);
    }

    if (!book && !isNaN(parseInt(bookId))) {
      const numId = parseInt(bookId);
      book = await Book.findOne({ numericId: numId });
    }

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
