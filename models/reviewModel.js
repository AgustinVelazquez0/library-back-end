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
    // Campo adicional para permitir múltiples reseñas del mismo usuario
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Si existe un índice compuesto que podría estar causando problemas, lo eliminamos explícitamente
// Nota: Solo es necesario ejecutar esto una vez en producción
reviewSchema.index({ book: 1, user: 1 }, { unique: false });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
