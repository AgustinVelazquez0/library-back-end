// routes/bookRoutes.js

const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const verifyToken = require("../middleware/verifyToken"); // Middleware de autenticación

// Rutas CRUD protegidas con JWT
router.post("/", verifyToken, bookController.createBook); // Crear un libro
router.get("/", verifyToken, bookController.getAllBooks); // Obtener todos los libros
router.get("/:id", verifyToken, bookController.getBookById); // Obtener un libro por ID
router.put("/:id", verifyToken, bookController.updateBook); // Actualizar un libro
router.delete("/:id", verifyToken, bookController.deleteBook); // Eliminar un libro

// Nueva ruta para cargar libros desde JSON
// Con autenticación

// router.post("/load", verifyToken, bookController.loadBooksFromJson);

// O sin autenticación (solo comentar la línea de arriba y descomentar esta)
router.post("/load", bookController.loadBooksFromJson);

module.exports = router;
