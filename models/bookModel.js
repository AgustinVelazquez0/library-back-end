const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Book", bookSchema);
