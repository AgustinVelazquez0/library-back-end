const Review = require("../models/reviewModel");
const Book = require("../models/bookModel"); // Asumiendo que tienes un modelo de libro

// Crear una nueva reseña
exports.createReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;
    const userId = req.user.id; // Obtenido del middleware verifyToken
    const username = req.user.username; // Asumiendo que guardas el username en el token

    // Buscar el libro por su id numérico en lugar de _id
    const book = await Book.findOne({ id: bookId });

    // Verificar si el libro existe
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

// Obtener todas las reseñas de un libro
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 }); // Ordenar por más reciente primero

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las reseñas",
      error: error.message,
    });
  }
};

// Actualizar una reseña
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Verificar que la reseña exista y pertenezca al usuario
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Reseña no encontrada" });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar esta reseña" });
    }

    // Actualizar la reseña
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    res.status(200).json({
      message: "Reseña actualizada exitosamente",
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar la reseña",
      error: error.message,
    });
  }
};

// Eliminar una reseña
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que la reseña exista y pertenezca al usuario
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Reseña no encontrada" });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta reseña" });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Reseña eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar la reseña",
      error: error.message,
    });
  }
};

// Obtener una reseña específica
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Reseña no encontrada" });
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la reseña",
      error: error.message,
    });
  }
};

// Obtener todas las reseñas hechas por un usuario
exports.getReviewsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las reseñas del usuario",
      error: error.message,
    });
  }
};
