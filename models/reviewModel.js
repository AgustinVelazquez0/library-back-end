const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Cambiado a false para permitir reseñas anónimas inicialmente
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
      default: "Anónimo", // Valor por defecto para reseñas anónimas
    },
  },
  { timestamps: true }
);

// Índice compuesto para evitar reseñas duplicadas del mismo usuario para el mismo libro
// Solo si el usuario está autenticado
reviewSchema.index({ book: 1, user: 1 }, { unique: true, sparse: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
