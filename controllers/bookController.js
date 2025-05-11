const Book = require("../models/bookModel");
const mongoose = require("mongoose");

// Función auxiliar para verificar si un string es un ObjectId válido
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Función para obtener un libro por su ID, puede ser ObjectId o ID simple
const getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    let book;

    // Si es un ObjectId válido, buscamos por _id
    if (isValidObjectId(id)) {
      book = await Book.findById(id);
    } else {
      // Si no es un ObjectId válido, buscamos por el campo simpleId
      // o podríamos buscar por título u otro campo único
      book = await Book.findOne({ simpleId: id });
    }

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    return res.status(200).json({ book });
  } catch (error) {
    console.error("Error al obtener libro:", error);
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  getBookById,
  // Tus otras funciones de controlador
};
