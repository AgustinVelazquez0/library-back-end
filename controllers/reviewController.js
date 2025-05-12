// controllers/reviewController.js
const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const Book = require("../models/bookModel");

exports.createReview = async (req, res) => {
  try {
    // Obtenemos el ID del usuario desde el token de autenticación
    const userId = req.user.id;

    // Obtenemos los datos de la reseña del cuerpo de la petición
    const { bookId, rating, comment } = req.body;

    // Validación de datos
    if (!bookId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Por favor, proporciona todos los campos requeridos",
      });
    }

    // Comprobamos si el libro existe
    const bookExists = await Book.findById(bookId);
    if (!bookExists) {
      return res.status(404).json({
        success: false,
        message: "Libro no encontrado",
      });
    }

    // Obtenemos información del usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Comprobamos si el usuario ya ha escrito una reseña para este libro
    const existingReview = await Review.findOne({ userId, bookId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Ya has escrito una reseña para este libro",
      });
    }

    // Creamos la nueva reseña
    const newReview = new Review({
      userId,
      bookId,
      username: user.name || user.email,
      rating,
      comment,
    });

    // Guardamos la reseña en la base de datos
    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: "Reseña creada con éxito",
      review: savedReview,
    });
  } catch (error) {
    console.error("Error al crear reseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la reseña",
      error: error.message,
    });
  }
};

exports.getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validamos que se proporcione un ID de libro válido
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "ID de libro no proporcionado",
      });
    }

    // Buscamos todas las reseñas de este libro
    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reseñas",
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
