require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const winston = require("winston");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Routes
const bookRoutes = require("./routes/bookRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Corner Rare Books API",
      version: "1.0.0",
      description: "API profesional para la gestión de biblioteca digital",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://library-back-end-9vgl.onrender.com"
            : `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(swaggerOptions);

// Security & Performance Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rate limiting profesional
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error:
      "Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login por IP
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

// CORS avanzado
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "10mb" }));

// API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Log de rutas (mejorado)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);

// Conexión a MongoDB con mejor manejo
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("✅ Conexión a MongoDB exitosa");
    console.log("✅ Conexión a MongoDB exitosa");
  })
  .catch((err) => {
    logger.error("❌ Error conectando a MongoDB:", err);
    console.error("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  });

// Error handling profesional
app.use((err, req, res, next) => {
  logger.error("Error no manejado:", {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Ha ocurrido un error en el servidor"
        : err.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.originalUrl,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM recibido, cerrando servidor...");
  mongoose.connection.close();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
});
