// Este script inicializa los libros de books.json en la base de datos
// Guardarlo como initBooks.js y ejecutarlo con node initBooks.js

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Book = require("./models/bookModel"); // Asegúrate de que la ruta sea correcta

// Configura la conexión a MongoDB (igual que en app.js)
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/library";

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Conectado a MongoDB");

    try {
      // Leer el archivo books.json
      const booksData = JSON.parse(
        fs.readFileSync(path.join(__dirname, "books.json"), "utf8")
      );

      console.log(`Encontrados ${booksData.length} libros en el archivo JSON`);

      // Insertar o actualizar cada libro
      for (const bookData of booksData) {
        // Convertir el ID numérico a string para usarlo como simpleId
        const simpleId = String(bookData.id);

        // Verificar si el libro ya existe por simpleId
        const existingBook = await Book.findOne({ simpleId });

        if (existingBook) {
          console.log(`Actualizando libro existente: ${bookData.title}`);

          // Actualizar el libro existente
          await Book.findByIdAndUpdate(existingBook._id, {
            title: bookData.title,
            author: bookData.author,
            description: bookData.description || "Sin descripción",
            category: bookData.category || "Sin categoría",
            coverImage: bookData.coverImage || "",
            driveLink: bookData.driveLink || "",
            rating: bookData.rating || 0,
            // No actualizamos simpleId para mantener consistencia
          });
        } else {
          console.log(`Creando nuevo libro: ${bookData.title}`);

          // Crear un nuevo libro
          const newBook = new Book({
            title: bookData.title,
            author: bookData.author,
            description: bookData.description || "Sin descripción",
            category: bookData.category || "Sin categoría",
            coverImage: bookData.coverImage || "",
            driveLink: bookData.driveLink || "",
            rating: bookData.rating || 0,
            simpleId,
          });

          await newBook.save();
        }
      }

      console.log("Proceso de inicialización completado");
    } catch (error) {
      console.error("Error al procesar books.json:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err);
  });
