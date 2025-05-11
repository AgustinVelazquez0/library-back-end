// loadBooks.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Configuración
const API_URL = "https://library-back-end-9vgl.onrender.com/api/books/load";
const JSON_FILE_PATH = path.join(__dirname, "books.json"); // Ajusta según la ubicación de tu archivo JSON

// Si necesitas autenticación
const TOKEN = "tu-token-jwt-aquí"; // Reemplaza con tu token JWT válido

// Cargar datos del JSON
const loadBooksData = () => {
  try {
    const data = fs.readFileSync(JSON_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer el archivo JSON:", error.message);
    process.exit(1);
  }
};

// Cargar libros en la base de datos
const loadBooks = async () => {
  try {
    const booksData = loadBooksData();

    console.log(`Intentando cargar ${booksData.length} libros...`);

    const headers = {
      "Content-Type": "application/json",
    };

    // Añadir token si se requiere autenticación
    if (TOKEN) {
      headers["Authorization"] = `Bearer ${TOKEN}`;
    }

    const response = await axios.post(API_URL, booksData, { headers });

    console.log("Respuesta del servidor:", response.data);
    console.log(
      `${response.data.books?.length || 0} libros cargados exitosamente`
    );
  } catch (error) {
    console.error("Error al cargar los libros:");

    if (error.response) {
      // El servidor respondió con un código de estado que no está en el rango 2xx
      console.error(`Estado: ${error.response.status}`);
      console.error("Datos:", error.response.data);
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      console.error("No se recibió respuesta del servidor");
    } else {
      // Algo ocurrió al configurar la solicitud
      console.error("Error:", error.message);
    }
  }
};

// Ejecutar la función
loadBooks();
