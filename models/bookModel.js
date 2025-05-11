const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    // Añadido campo numericId para mantener compatibilidad con IDs numéricos de tu JSON
    numericId: {
      type: Number,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    driveLink: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    publicationYear: {
      type: Number,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    pages: {
      type: Number,
      required: true,
    },
  },
  {
    // Añadido timestamps para registrar fechas de creación y actualización
    timestamps: true,
  }
);

// Método estático para encontrar un libro por cualquier tipo de ID
bookSchema.statics.findByAnyId = async function (id) {
  // Array de condiciones para buscar
  const conditions = [{ _id: id }];

  // Si es un número, añadimos versión string
  if (!isNaN(id)) {
    conditions.push({ _id: id.toString() });
  }

  // Si parece un ObjectId válido
  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      conditions.push({ _id: mongoose.Types.ObjectId(id) });
    } catch (err) {
      // Ignorar si no es un ObjectId válido
    }
  }

  // Buscar con cualquiera de las condiciones
  return this.findOne({ $or: conditions });
};

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
