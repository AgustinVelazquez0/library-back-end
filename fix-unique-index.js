const mongoose = require("mongoose");
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/library";

async function removeUniqueIndexes() {
  try {
    await mongoose.connect(uri);
    console.log("Conectado a MongoDB");

    const db = mongoose.connection;

    // Verificar si la colección 'reviews' existe
    const collections = await db.db.listCollections().toArray();
    const reviewsExists = collections.some((col) => col.name === "reviews");

    if (!reviewsExists) {
      console.log("La colección 'reviews' no existe. Creándola...");
      await db.createCollection("reviews");
      console.log("Colección 'reviews' creada.");
    }

    const indexes = await db.collection("reviews").indexes();
    console.log("Índices actuales:", indexes);

    for (const index of indexes) {
      if (index.unique === true && index.name !== "_id_") {
        console.log(`Eliminando índice único: ${index.name}`);
        await db.collection("reviews").dropIndex(index.name);
        console.log(`Índice ${index.name} eliminado`);
      }
    }

    console.log("Proceso completado con éxito");
  } catch (error) {
    console.error("Error al eliminar índices:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

removeUniqueIndexes();
