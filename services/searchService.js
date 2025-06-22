const Fuse = require("fuse.js");
const NodeCache = require("node-cache");

// Cache de 10 minutos
const cache = new NodeCache({ stdTTL: 600 });

class SearchService {
  constructor() {
    this.fuse = null;
    this.books = [];
  }

  // Configuración de búsqueda inteligente
  getFuseOptions() {
    return {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "author", weight: 0.5 },
        { name: "description", weight: 0.3 },
        { name: "category", weight: 0.4 },
        { name: "language", weight: 0.2 },
      ],
      threshold: 0.4, // Tolerancia a typos
      distance: 100,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };
  }

  // Inicializar búsqueda con libros
  initializeSearch(books) {
    this.books = books;
    this.fuse = new Fuse(books, this.getFuseOptions());

    // Limpiar cache cuando se actualiza la data
    cache.flushAll();

    console.log(
      `🔍 Búsqueda inteligente inicializada con ${books.length} libros`
    );
  }

  // Búsqueda principal
  search(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return this.books;
    }

    const cacheKey = `search:${query.toLowerCase()}:${JSON.stringify(options)}`;

    // Verificar cache primero
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`⚡ Cache hit para: "${query}"`);
      return cached;
    }

    const startTime = Date.now();

    // Búsqueda con Fuse.js
    const results = this.fuse.search(query);

    // Procesar resultados
    const processedResults = results.map((result) => ({
      ...result.item,
      searchScore: result.score,
      matches: result.matches,
    }));

    // Filtros adicionales
    let filteredResults = processedResults;

    if (options.category) {
      filteredResults = filteredResults.filter((book) =>
        book.category.toLowerCase().includes(options.category.toLowerCase())
      );
    }

    if (options.minRating) {
      filteredResults = filteredResults.filter(
        (book) => book.rating >= options.minRating
      );
    }

    if (options.language) {
      filteredResults = filteredResults.filter(
        (book) => book.language.toLowerCase() === options.language.toLowerCase()
      );
    }

    // Limitar resultados
    const limit = options.limit || 20;
    const finalResults = filteredResults.slice(0, limit);

    const searchTime = Date.now() - startTime;

    // Guardar en cache
    cache.set(cacheKey, finalResults);

    console.log(
      `🔍 Búsqueda "${query}" completada en ${searchTime}ms - ${finalResults.length} resultados`
    );

    return finalResults;
  }

  // Búsqueda por categorías
  searchByCategory(category) {
    const cacheKey = `category:${category.toLowerCase()}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const results = this.books.filter((book) =>
      book.category.toLowerCase().includes(category.toLowerCase())
    );

    cache.set(cacheKey, results);
    return results;
  }

  // Obtener estadísticas de búsqueda
  getSearchStats() {
    return {
      totalBooks: this.books.length,
      cacheKeys: cache.keys().length,
      cacheStats: cache.getStats(),
    };
  }

  // Limpiar cache manualmente
  clearCache() {
    cache.flushAll();
    console.log("🗑️ Cache de búsqueda limpiado");
  }
}

module.exports = new SearchService();
