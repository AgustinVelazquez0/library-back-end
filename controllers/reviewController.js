const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");

// Función para crear una nueva reseña
const createReview = async (req, res) => {
  const { bookId, rating, comment } = req.body;

  try {
    // Verificamos que el libro exista
    const book = await Book.findById(bookId);
    if (!book) {
      console.log("Libro no encontrado con ID:", bookId);
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Información del usuario (opcional si está autenticado)
    let userData = {};
    if (req.user) {
      userData = {
        user: req.user._id,
        username: req.user.username || req.user.email,
      };
    }

    // Creamos la reseña
    const newReview = new Review({
      book: bookId, // Asegúrate de usar "book" aquí para coincidir con el modelo
      rating,
      comment,
      ...userData,
    });

    await newReview.save();

    return res.status(201).json({
      message: "Reseña creada correctamente",
      review: newReview,
    });
  } catch (error) {
    console.error("Error al crear reseña:", error);
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
    console.log("Buscando reseñas para el libro:", bookId);

    // Buscamos las reseñas del libro
    const reviews = await Review.find({ book: bookId })
      .sort({ createdAt: -1 }) // Ordenar por más recientes primero
      .populate("user", "username"); // Opcional: poblar datos del usuario

    console.log("Reseñas encontradas:", reviews.length);

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
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
