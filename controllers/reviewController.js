const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");
const mongoose = require("mongoose");

// Función auxiliar para verificar si un string es un ObjectId válido
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Función para crear una nueva reseña
const createReview = async (req, res) => {
  // Cambia bookId por book para mantener consistencia
  const { bookId, rating, comment } = req.body;

  try {
    console.log("Intento de crear reseña para libro con ID:", bookId);

    // Verificamos que el libro exista
    let book;

    // Si es un ObjectId válido, buscamos por _id
    if (isValidObjectId(bookId)) {
      book = await Book.findById(bookId);
    } else {
      // Si no es un ObjectId válido, intentamos buscar por simpleId
      book = await Book.findOne({ simpleId: String(bookId) });

      // Si aún no encontramos el libro, lo creamos con el simpleId
      if (!book) {
        console.log(
          "Libro no encontrado. Creando nuevo libro con simpleId:",
          bookId
        );
        book = new Book({
          title: `Libro ${bookId}`,
          author: "Autor Desconocido",
          description: "Descripción pendiente",
          category: "Sin categoría",
          simpleId: String(bookId),
        });
        await book.save();
        console.log("Libro creado:", book);
      }
    }

    if (!book) {
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

    // Creamos la reseña con los campos correctos
    const newReview = new Review({
      book: book._id, // campo book, no bookId
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

    // Manejo especial para errores de duplicación
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya has dejado una reseña para este libro",
        details: error.message,
      });
    }

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
    console.log("Buscando reseñas para el libro con ID:", bookId);

    let book;
    // Si es un ObjectId válido, buscamos por _id
    if (isValidObjectId(bookId)) {
      book = await Book.findById(bookId);
    } else {
      // Si no es un ObjectId válido, buscamos por simpleId
      book = await Book.findOne({ simpleId: String(bookId) });
    }

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Buscamos las reseñas del libro
    const reviews = await Review.find({ book: book._id })
      .sort({ createdAt: -1 }) // Ordenar por más recientes primero
      .populate("user", "username"); // Opcional: poblar datos del usuario

    console.log(
      `Encontradas ${reviews.length} reseñas para el libro ${book.title}`
    );

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
