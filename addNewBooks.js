const mongoose = require("mongoose");
const Book = require("./models/bookModel");

// Conectar a MongoDB
const MONGODB_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://agubolso2:pnuudvwT68Uv4qhva1ustaro.ovojdqr.mongodb.net/library?retryWrites=true&w=majority";

// 📚 LIBROS NUEVOS PARA AGREGAR
const newBooks = [
  {
    numericId: 30,
    title: "Nuevo Libro Ejemplo",
    author: "Autor Ejemplo",
    description: "Descripción del nuevo libro...",
    category: "Filosofía",
    coverImage: "https://ejemplo.com/imagen.jpg",
    driveLink: "https://drive.google.com/file/d/ejemplo/view",
    rating: 4.5,
    language: "Español",
    pages: 250,
    publicationYear: 2024,
  },
  // Agrega más libros aquí...
];

async function addNewBooks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    let added = 0;
    let existing = 0;

    for (const bookData of newBooks) {
      try {
        // Verificar si ya existe
        const exists = await Book.findOne({ numericId: bookData.numericId });

        if (!exists) {
          const newBook = new Book(bookData);
          await newBook.save();
          console.log(`✅ Agregado: ${bookData.title}`);
          added++;
        } else {
          console.log(`⚠️ Ya existe: ${bookData.title}`);
          existing++;
        }
      } catch (error) {
        console.error(`❌ Error con ${bookData.title}:`, error.message);
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`- Libros agregados: ${added}`);
    console.log(`- Libros ya existentes: ${existing}`);
    console.log(`- Total procesados: ${newBooks.length}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

// Ejecutar el script
addNewBooks();
