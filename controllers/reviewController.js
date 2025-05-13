// controllers/reviewController.js
const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");
const jwt = require("jsonwebtoken");

// Crear una nueva reseña
exports.createReview = async (req, res) => {
  try {
    // Obtenemos el token desde los encabezados de la solicitud
    const token = req.headers.authorization.split(" ")[1]; // Obtenemos el token después de "Bearer"

    // Decodificamos el token para obtener el userId y reviewerName
    const decodedToken = jwt.decode(token);
    const userId = decodedToken.id; // ID del usuario
    const reviewerName = decodedToken.name; // Nombre del usuario

    // Datos de la reseña recibidos desde el frontend
    const { bookId, rating, comment } = req.body;

    // Buscamos el libro con el ID recibido
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Libro no encontrado",
      });
    }

    // Creamos la reseña
    const newReview = new Review({
      bookId: book._id,
      rating,
      comment,
      userId,
      reviewerName,
    });

    // Guardamos la reseña en la base de datos
    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Reseña creada con éxito",
      review: newReview,
    });
  } catch (error) {
    console.error("Error al crear la reseña:", error);
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
exports.getBookReviews = async (req, res) => {
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

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Buscamos la reseña
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada",
      });
    }

    // Verificamos que el usuario sea el autor de la reseña o un administrador
    if (review.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar esta reseña",
      });
    }

    // Eliminamos la reseña
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Reseña eliminada con éxito",
    });
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la reseña",
      error: error.message,
    });
  }
};

// Opcional: Actualizar una reseña existente
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Validación de datos
    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: "No hay datos para actualizar",
      });
    }

    // Buscamos la reseña
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada",
      });
    }

    // Verificamos que el usuario sea el autor de la reseña
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para actualizar esta reseña",
      });
    }

    // Actualizamos la reseña
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.updatedAt = Date.now();

    // Guardamos los cambios
    const updatedReview = await review.save();

    res.status(200).json({
      success: true,
      message: "Reseña actualizada con éxito",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la reseña",
      error: error.message,
    });
  }
};
