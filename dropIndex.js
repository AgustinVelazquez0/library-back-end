const mongoose = require("mongoose");
const Review = require("./models/reviewModel");

async function dropReviewIndex() {
  try {
    await mongoose.connect("mongodb://localhost:27017/library"); // cambiá el nombre si tu DB no se llama library

    db.reviews.getIndexes();

    const result = await Review.collection.dropIndex("book_1_user_1");
    console.log("Índice eliminado:", result);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error eliminando índice:", err.message);
  }
}

dropReviewIndex();
