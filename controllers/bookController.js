// controllers/bookController.js

const Book = require("../models/bookModel");
const mongoose = require("mongoose");
const searchService = require("../services/searchService");

// Función auxiliar para verificar si un string es un ObjectId válido
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Crear un libro
exports.createBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();

    // Reinicializar búsqueda cuando se añade un libro
    const allBooks = await Book.find().lean();
    searchService.initializeSearch(allBooks);

    res.status(201).json(savedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todos los libros (CORREGIDA)
exports.getAllBooks = async (req, res) => {
  try {
    const { search, q, category, minRating, language, limit } = req.query;
    const searchQuery = search || q;

    if (searchQuery || category) {
      return exports.searchBooks(req, res);
    }

    // 🚀 OPTIMIZACIÓN: Proyección para campos específicos
    const books = await Book.find()
      .select(
        "title author description category coverImage rating language pages publicationYear numericId driveLink"
      )
      .lean() // Más rápido que documentos Mongoose completos
      .limit(parseInt(limit) || 100) // Limitar resultados
      .sort({ numericId: 1 }); // Ordenar por ID

    // 🔥 Cache control
    res.set("X-Total-Count", books.length);

    // 🔥 INICIALIZAR BÚSQUEDA SI NO ESTÁ INICIALIZADA
    if (!searchService.fuse) {
      searchService.initializeSearch(books);
    }

    res.status(200).json(books);
  } catch (err) {
    console.error("Error en getAllBooks:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔍 FUNCIÓN DE BÚSQUEDA INTELIGENTE - COMPLETAMENTE ARREGLADA
exports.searchBooks = async (req, res) => {
  try {
    const { q, category, minRating, language, limit } = req.query;

    console.log(`🔍 Búsqueda solicitada: "${q}"`);

    // Si no hay búsqueda, devolver todos
    if (!q && !category) {
      return exports.getAllBooks(req, res);
    }

    // 🔥 OBTENER LIBROS FRESCOS DE LA BASE DE DATOS
    const allBooks = await Book.find().lean();

    console.log(`📚 Libros obtenidos de DB: ${allBooks.length}`);

    if (allBooks.length === 0) {
      return res.status(200).json({
        query: q,
        totalResults: 0,
        results: [],
        message: "No hay libros en la base de datos",
      });
    }

    // Debug: Mostrar el primer libro
    console.log(`📄 Primer libro de ejemplo:`, {
      id: allBooks[0]._id,
      title: allBooks[0].title,
      author: allBooks[0].author,
    });

    // 🔥 REINICIALIZAR BÚSQUEDA CON DATOS FRESCOS
    searchService.initializeSearch(allBooks);

    const options = {
      category,
      minRating: minRating ? parseFloat(minRating) : undefined,
      language,
      limit: limit ? parseInt(limit) : 20,
    };

    console.log(`🎯 Opciones de búsqueda:`, options);

    // 🔍 REALIZAR BÚSQUEDA
    const results = searchService.search(q || "", options);

    console.log(`✅ Resultados encontrados: ${results.length}`);

    // Debug: Mostrar el primer resultado
    if (results.length > 0) {
      console.log(`📄 Primer resultado:`, {
        title: results[0].title,
        author: results[0].author,
        searchScore: results[0].searchScore,
      });
    }

    // 🔥 TRANSFORMAR RESULTADOS PARA FRONTEND
    const transformedResults = results.map((book) => ({
      id: book.numericId || book.id || book._id?.toString(),
      _id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      coverImage: book.coverImage,
      driveLink: book.driveLink,
      rating: book.rating,
      language: book.language,
      pages: book.pages,
      publicationYear: book.publicationYear,
      searchScore: book.searchScore,
      matches: book.matches,
    }));

    console.log(`🎯 Resultados transformados: ${transformedResults.length}`);

    res.status(200).json({
      query: q,
      filters: options,
      totalResults: transformedResults.length,
      results: transformedResults,
      searchStats: searchService.getSearchStats(),
    });
  } catch (err) {
    console.error("❌ Error en búsqueda:", err);
    res.status(500).json({
      error: err.message,
      query: req.query.q,
    });
  }
};

// 🎯 BÚSQUEDA POR CATEGORÍA
exports.getBooksByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!searchService.fuse) {
      const books = await Book.find().lean();
      searchService.initializeSearch(books);
    }

    const results = searchService.searchByCategory(category);

    res.status(200).json({
      category,
      totalResults: results.length,
      results: results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener un libro por ID (sin cambios)
exports.getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    let book;

    if (isValidObjectId(id)) {
      book = await Book.findById(id);
    } else {
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

    // Reinicializar búsqueda cuando se actualiza un libro
    const allBooks = await Book.find().lean();
    searchService.initializeSearch(allBooks);

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

    // Reinicializar búsqueda cuando se elimina un libro
    const allBooks = await Book.find().lean();
    searchService.initializeSearch(allBooks);

    res.status(200).json({ message: "Libro eliminado con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cargar libros desde JSON (actualizado)
exports.loadBooksFromJson = async (req, res) => {
  try {
    const booksData = req.body;

    if (!Array.isArray(booksData)) {
      return res
        .status(400)
        .json({ message: "Se esperaba un array de libros" });
    }

    const booksToInsert = booksData.map((book) => {
      const bookToSave = { ...book };

      if (typeof bookToSave.id === "number") {
        bookToSave.numericId = bookToSave.id;
      }

      return bookToSave;
    });

    const result = await Book.insertMany(booksToInsert, { ordered: false });

    // 🔍 Reinicializar búsqueda después de cargar libros
    const allBooks = await Book.find().lean();
    searchService.initializeSearch(allBooks);

    res.status(201).json({
      message: `${result.length} libros cargados exitosamente`,
      books: result,
    });
  } catch (error) {
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

// 📊 ESTADÍSTICAS DE BÚSQUEDA (CORREGIDA)
exports.getSearchStats = async (req, res) => {
  try {
    // 🔥 ASEGURAR QUE ESTÉ INICIALIZADO
    if (!searchService.fuse) {
      console.log("⚠️ SearchService no inicializado, inicializando...");
      const allBooks = await Book.find().lean();
      searchService.initializeSearch(allBooks);
    }

    const stats = searchService.getSearchStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🗑️ LIMPIAR CACHE
exports.clearSearchCache = async (req, res) => {
  try {
    searchService.clearCache();
    res.status(200).json({ message: "Cache de búsqueda limpiado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
