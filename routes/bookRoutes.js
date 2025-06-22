// routes/bookRoutes.js

const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const verifyToken = require("../middleware/verifyToken");

// 🔍 NUEVAS RUTAS DE BÚSQUEDA (SIN autenticación para mejor UX)
router.get("/search", bookController.searchBooks);
router.get("/category/:category", bookController.getBooksByCategory);
router.get("/stats", bookController.getSearchStats);
router.post("/cache/clear", verifyToken, bookController.clearSearchCache);

// Rutas CRUD existentes (GET sin autenticación para mejor UX del frontend)
router.post("/", verifyToken, bookController.createBook);
router.get("/", bookController.getAllBooks);
router.get("/:id", bookController.getBookById);
router.put("/:id", verifyToken, bookController.updateBook);
router.delete("/:id", verifyToken, bookController.deleteBook);
router.post("/load", bookController.loadBooksFromJson);

// 🔄 RUTA TEMPORAL DE MIGRACIÓN (requiere autenticación)
router.post("/migrate", verifyToken, bookController.migrateAllBooks);

module.exports = router;
