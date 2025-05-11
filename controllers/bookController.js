// controllers/bookController.js

const Book = require("../models/bookModel");
const mongoose = require("mongoose");

// Función auxiliar para verificar si un string es un ObjectId válido
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Crear un libro
exports.createBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todos los libros
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener un libro por ID, puede ser ObjectId o ID simple
exports.getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    let book;

    // Si es un ObjectId válido, buscamos por _id
    if (isValidObjectId(id)) {
      book = await Book.findById(id);
    } else {
      // Si no es un ObjectId válido, buscamos por el campo simpleId
      book = await Book.findOne({ simpleId: id });
    }

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    return res.status(200).json({ book });
  } catch (error) {
    console.error("Error al obtener libro:", error);
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
};

// Actualizar un libro
exports.updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedBook)
      return res.status(404).json({ message: "Libro no encontrado" });
    res.status(200).json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar un libro
exports.deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook)
      return res.status(404).json({ message: "Libro no encontrado" });
    res.status(200).json({ message: "Libro eliminado con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cargar libros desde JSON
exports.loadBooksFromJson = async (req, res) => {
  try {
    const booksData = req.body;

    if (!Array.isArray(booksData)) {
      return res
        .status(400)
        .json({ message: "Se esperaba un array de libros" });
    }

    // Prepara los libros para inserción
    const booksToInsert = booksData.map((book) => {
      const bookToSave = { ...book };

      // Si el libro ya tiene un _id de MongoDB válido, lo mantenemos
      // De lo contrario, MongoDB generará uno nuevo

      // Asegúrate de mantener el id numérico como numericId
      if (typeof bookToSave.id === "number") {
        bookToSave.numericId = bookToSave.id;
      }

      return bookToSave;
    });

    // Usa insertMany con la opción ordered:false para continuar
    // incluso si hay algunos duplicados
    const result = await Book.insertMany(booksToInsert, { ordered: false });

    res.status(201).json({
      message: `${result.length} libros cargados exitosamente`,
      books: result,
    });
  } catch (error) {
    // Manejo especial para errores de duplicación
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Algunos libros ya existen en la base de datos",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Error al cargar los libros",
      error: error.message,
    });
  }
};
