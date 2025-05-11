const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId, // Cambio aquí, ahora es ObjectId
      ref: "Book", // Referencia al modelo "Book"
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Esto está bien, hace referencia al modelo "User"
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, // Puntuación mínima de 1
      max: 5, // Puntuación máxima de 5
    },
    comment: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Índice compuesto para evitar reseñas duplicadas del mismo usuario para el mismo libro
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
