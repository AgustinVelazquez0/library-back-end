// reviewController.js
const Review = require("../models/reviewModel"); // El modelo de reseñas
const Book = require("../models/bookModel"); // El modelo de libros, asegúrate de tenerlo

// Crear una reseña
const createReview = async (req, res) => {
  const { bookId, rating, comment } = req.body;

  try {
    // Verificar si el libro existe
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Crear la reseña
    const review = new Review({
      bookId,
      rating,
      comment,
    });

    // Guardar la reseña en la base de datos
    await review.save();

    // Responder con la reseña creada
    return res.status(201).json({
      message: "Reseña creada con éxito",
      review,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error al crear la reseña", error: err.message });
  }
};

// Obtener reseñas por libro
const getReviewsByBook = async (req, res) => {
  const { bookId } = req.params;

  try {
    // Buscar reseñas por libro
    const reviews = await Review.find({ bookId });

    if (reviews.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron reseñas para este libro" });
    }

    return res.status(200).json(reviews);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error al obtener reseñas", error: err.message });
  }
};

module.exports = {
  createReview,
  getReviewsByBook,
};
