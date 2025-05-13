// routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const verifyToken = require("../middleware/verifyToken"); // Middleware de autenticación

// Rutas públicas (sin autenticación)
router.get("/", bookController.getAllBooks); // Obtener todos los libros
router.get("/:id", bookController.getBookById); // Obtener un libro por ID

// Rutas protegidas con JWT (requieren autenticación)
router.post("/", verifyToken, bookController.createBook); // Crear un libro
router.put("/:id", verifyToken, bookController.updateBook); // Actualizar un libro
router.delete("/:id", verifyToken, bookController.deleteBook); // Eliminar un libro

// Ruta para cargar libros desde JSON
router.post("/load", bookController.loadBooksFromJson);

module.exports = router;
