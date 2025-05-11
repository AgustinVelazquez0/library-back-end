const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
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
    simpleId: {
      type: String,
      required: false,
      index: true, // Índice para búsquedas más rápidas
    },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
