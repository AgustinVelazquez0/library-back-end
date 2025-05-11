const Review = require("../models/reviewModel");
const Book = require("../models/bookModel");
const mongoose = require("mongoose");

// Función auxiliar para verificar si un string es un ObjectId válido
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Función para crear una nueva reseña
const createReview = async (req, res) => {
  // Extraemos los campos del cuerpo de la petición
  // Nota: Aceptamos tanto 'book' como 'bookId' para mayor compatibilidad
  const { book, bookId, rating, comment } = req.body;

  // Usamos el primero que no sea undefined
  const bookIdentifier = book || bookId;

  if (!bookIdentifier) {
    return res.status(400).json({ message: "El ID del libro es obligatorio" });
  }

  try {
    console.log("Intento de crear reseña para libro con ID:", bookIdentifier);

    // Verificamos que el libro exista
    let bookDoc;

    // Si es un ObjectId válido, buscamos por _id
    if (isValidObjectId(bookIdentifier)) {
      bookDoc = await Book.findById(bookIdentifier);
    } else {
      // Si no es un ObjectId válido, intentamos buscar por simpleId
      bookDoc = await Book.findOne({ simpleId: String(bookIdentifier) });

      // Si aún no encontramos el libro, lo creamos con el simpleId
      if (!bookDoc) {
        console.log(
          "Libro no encontrado. Creando nuevo libro con simpleId:",
          bookIdentifier
        );
        bookDoc = new Book({
          title: `Libro ${bookIdentifier}`,
          author: "Autor Desconocido",
          description: "Descripción pendiente",
          category: "Sin categoría",
          simpleId: String(bookIdentifier),
        });
        await bookDoc.save();
        console.log("Libro creado:", bookDoc);
      }
    }

    if (!bookDoc) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Información del usuario (opcional si está autenticado)
    let userData = {};
    if (req.user) {
      userData = {
        user: req.user._id,
        username: req.user.username || req.user.email,
      };

      // Verificamos si el usuario ya ha dejado reseñas para este libro
      const existingReview = await Review.findOne({
        book: bookDoc._id,
        user: req.user._id,
      });

      // Si ya existe una reseña, la eliminamos para permitir una nueva
      if (existingReview) {
        console.log(
          `Eliminando reseña existente del usuario ${req.user._id} para el libro ${bookDoc._id}`
        );
        await Review.findByIdAndDelete(existingReview._id);
        console.log("Reseña anterior eliminada con éxito");
      }
    }

    // Creamos la reseña con los campos correctos
    const newReview = new Review({
      book: bookDoc._id,
      rating: Number(rating),
      comment,
      timestamp: new Date(),
      user: req.user.id, //
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
      // Intentamos resolver el conflicto automáticamente
      try {
        // Extraemos información de la clave duplicada
        const keyValue = error.keyValue || {};
        const bookId = keyValue.book;
        const userId = keyValue.user;

        // Si tenemos suficiente información, eliminamos la reseña duplicada
        if (bookId && userId) {
          await Review.deleteOne({ book: bookId, user: userId });

          // Volvemos a intentar crear la reseña
          const userData = req.user
            ? {
                user: req.user._id,
                username: req.user.username || req.user.email,
              }
            : {};

          const newReview = new Review({
            book: bookId,
            rating: Number(rating),
            comment,
            timestamp: new Date(),
            user: req.user.id,
          });

          await newReview.save();

          return res.status(201).json({
            message: "Reseña creada correctamente (reemplazando anterior)",
            review: newReview,
          });
        }
      } catch (retryError) {
        console.error("Error al resolver conflicto:", retryError);
      }

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
