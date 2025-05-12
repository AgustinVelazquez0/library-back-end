// controllers/reviewController.js
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");
const mongoose = require("mongoose");

// Crear una nueva reseña
exports.createReview = async (req, res) => {
  try {
    const { bookId, rating, comment, userId, username } = req.body;

    console.log(
      `Recibida solicitud para crear reseña para el libro ID: ${bookId}`
    );

    // Necesitamos encontrar el libro usando numericId en lugar de _id
    let book;

    // Si el bookId es un número o parece serlo (string numérico)
    if (!isNaN(bookId)) {
      console.log(`Buscando libro con numericId: ${bookId}`);
      book = await Book.findOne({ numericId: parseInt(bookId) });
    } else {
      // Si es un ObjectId
      console.log(`Buscando libro con _id: ${bookId}`);
      book = await Book.findById(bookId);
    }

    if (!book) {
      console.log(`No se encontró el libro con ID: ${bookId}`);
      return res.status(404).json({
        success: false,
        message: `No se encontró el libro con ID: ${bookId}`,
      });
    }

    console.log(`Libro encontrado: ${book.title} (ID: ${book._id})`);

    // Crear la reseña usando el _id del libro (ObjectId) que encontramos
    const newReview = new Review({
      userId,
      bookId: book._id, // Usar el ObjectId del libro
      username,
      rating,
      comment,
    });

    const savedReview = await newReview.save();
    console.log(`Reseña guardada con ID: ${savedReview._id}`);

    res.status(201).json({
      success: true,
      message: "Reseña creada exitosamente",
      data: savedReview,
    });
  } catch (error) {
    console.error("Error en createReview:", error);

    // Manejo especial para errores de validación de duplicados
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ya has escrito una reseña para este libro",
        error: "Duplicate review",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear la reseña",
      error: error.message,
    });
  }
};

// Obtener todas las reseñas
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("bookId", "title author coverImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las reseñas",
      error: error.message,
    });
  }
};

// Obtener reseñas por ID de libro
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    let book;

    // Si el bookId es un número o parece serlo
    if (!isNaN(bookId)) {
      book = await Book.findOne({ numericId: parseInt(bookId) });
    } else {
      // Si es un ObjectId
      book = await Book.findById(bookId);
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el libro con ID: ${bookId}`,
      });
    }

    const reviews = await Review.find({ bookId: book._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las reseñas del libro",
      error: error.message,
    });
  }
};

// Otros métodos que puedas tener...
