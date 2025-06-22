const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    numericId: {
      type: Number,
      required: true,
      unique: true,
      index: true, // Añadido para mejorar búsquedas
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    driveLink: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "Español",
    },
    pages: {
      type: Number,
      default: 0,
    },
    publicationYear: {
      type: Number,
    },
    simpleId: {
      type: String,
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Agregar índices para consultas rápidas
bookSchema.index({ title: "text", author: "text", description: "text" });
bookSchema.index({ category: 1 });
bookSchema.index({ rating: -1 });
bookSchema.index({ language: 1 });
bookSchema.index({ numericId: 1 });
bookSchema.index({ createdAt: -1 });

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
