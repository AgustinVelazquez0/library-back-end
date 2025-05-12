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

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
