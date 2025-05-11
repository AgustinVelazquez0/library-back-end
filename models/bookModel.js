const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    // Añadido campo numericId para mantener compatibilidad con IDs numéricos de tu JSON
    numericId: {
      type: Number,
      index: true, // Para búsquedas más eficientes
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

module.exports = mongoose.model("Book", bookSchema);
