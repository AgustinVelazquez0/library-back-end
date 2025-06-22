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

// 🔄 MIGRACIÓN DE DATOS COMPLETOS (TEMPORAL)
exports.migrateAllBooks = async (req, res) => {
  try {
    console.log("🚀 Iniciando migración de datos completos...");

    // Datos completos de los 29 libros
    const completeBooks = [
      {
        numericId: 1,
        title: "El Libro Rojo",
        author: "Carl Gustav Jung",
        description:
          "El Libro Rojo de Carl Gustav Jung es un libro profético, pero no en el sentido banal de una anticipación sino como una advertencia acerca de la condición de todo ser humano, co-creador de la propia vida individual y el espíritu de su época. El libro es un viaje a través de la psique humana, donde Jung explora sus propios sueños, visiones y experiencias espirituales. A través de ilustraciones y textos poéticos, Jung presenta su búsqueda de significado y su comprensión del inconsciente colectivo.",
        category: "Psicoanalisis",
        coverImage:
          "https://www.libreriaberlin.com/imagenes/9789873/978987376142.GIF",
        driveLink:
          "https://drive.google.com/file/d/1tnd5pDArNPd0lilKh-xHoklHGBSXpErR/view?usp=drive_link",
        rating: 5,
        language: "Español",
        pages: 616,
        publicationYear: 2009,
      },
      {
        numericId: 2,
        title: "1984",
        author: "George Orwell",
        description:
          "Una novela distópica que explora la vigilancia y el totalitarismo. Ambientada en un futuro donde un régimen totalitario controla cada aspecto de la vida humana, incluyendo el pensamiento. Winston Smith, el protagonista, comienza a cuestionar el sistema y busca formas de rebelión, con consecuencias devastadoras.",
        category: "Critica política",
        coverImage:
          "https://picandocodigo.net/wp-content/uploads/2013/12/george-orwell-1984.jpg",
        driveLink:
          "https://drive.google.com/file/d/1szNaIhLmRYfwcj7yqNznFOAiDZ-PrMYa/view?usp=drive_link",
        rating: 5,
        language: "Inglés",
        pages: 352,
        publicationYear: 1949,
      },
      {
        numericId: 3,
        title: "Infocracia",
        author: "Byung-Chul Han",
        description:
          "Llamamos 'régimen de la información' a la forma de dominio en la que la información y su procesamiento mediante algoritmos e inteligencia artificial determinan de modo decisivo los procesos sociales, económicos y politicos. A diferencia del régimen de la disciplina, no se explotan cuerpos y energías, sino información y datos.",
        category: "Filosofía",
        coverImage:
          "https://cdn.luna.com.uy/escaramuza.com.uy/files/tmp/uncompressed/vahwlmcp08cghcr68o7j.jpg",
        driveLink:
          "https://drive.google.com/file/d/1InlYSABUb6RJMnR4bjJb9okYQY1t0Iaf/view?usp=drive_link",
        rating: 4.9,
        language: "Español",
        pages: 112,
        publicationYear: 2022,
      },
      {
        numericId: 4,
        title: "Como ganar amigos e influir sobre las personas",
        author: "Dale Carnegie",
        description:
          "Un clásico que ofrece consejos prácticos sobre cómo mejorar las relaciones interpersonales y la comunicación. Carnegie comparte principios fundamentales para influir en los demás, ganar su confianza y mejorar la calidad de nuestras interacciones sociales. Un libro esencial para quienes buscan desarrollar habilidades sociales efectivas.",
        category: "Psicología",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/360x360/4f/44/4f44531033c61ced6c3c003187e0b3d3.jpg",
        driveLink:
          "https://drive.google.com/file/d/1ObcPkwRClynVNGSe5pJdkvDoCFR3DPUX/view?usp=drive_link",
        rating: 4.9,
        language: "Español",
        pages: 318,
        publicationYear: 1936,
      },
      {
        numericId: 5,
        title: "La teoría sintergica",
        author: "Jacobo Grinberg Zylberbaum",
        description:
          "La teoría sintergica es un libro que explora la relación entre la conciencia y la realidad. El autor, Jacobo Grinberg Zylberbaum, presenta una teoría innovadora que busca entender cómo la percepción humana influye en la creación de la realidad. A través de una combinación de ciencia y divinidad, el libro invita a los lectores a reflexionar sobre su propia experiencia de vida y la conexión entre mente y universo.",
        category: "Neurociencia",
        coverImage: "https://ww2.ebookelo.com/images/cover/60603.jpg",
        driveLink:
          "https://drive.google.com/file/d/1fekY0w7LbbHReZBRyupDVq9IW3YCFPvl/view?usp=drive_link",
        rating: 4.6,
        language: "Español",
        pages: 136,
        publicationYear: 1991,
      },
      {
        numericId: 6,
        title: "Las 48 leyes del poder",
        author: "Robert Greene",
        description:
          "La estrategia, el poder, la seducción, la maestría de nuestras habilidades y las motivaciones psicológicas, sociales y culturales que guían nuestras decisiones cada día se presentan en libros amenos y aptos para triunfar en cualquier ámbito y conocer a profundidad nuestra naturaleza humana.",
        category: "Psicología",
        coverImage:
          "https://media.falabella.com/falabellaCO/119910885_01/w=1500,h=1500,fit=pad",
        driveLink:
          "https://drive.google.com/file/d/1NWEOdRcRanwj79_qaVdVGS9rPhgqEbjI/view?usp=drive_link",
        rating: 4.9,
        language: "Español",
        pages: 543,
        publicationYear: 1998,
      },
      {
        numericId: 7,
        title: "El hombre en busca de sentido",
        author: "Viktor Frankl",
        description:
          "Un libro que narra la experiencia del autor en un campo de concentración. A través de su sufrimiento, Frankl explora la búsqueda del sentido de la vida y cómo encontrar propósito incluso en las circunstancias más difíciles. La obra combina elementos de psicología y filosofía, ofreciendo una perspectiva única sobre la resiliencia humana y la importancia de encontrar significado en la vida.",
        category: "Psicología",
        coverImage:
          "https://images.cdn1.buscalibre.com/fit-in/360x360/f6/d0/f6d0aba3e83069dee397322df8889ec4.jpg",
        driveLink:
          "https://drive.google.com/file/d/10gVEN96ef6Q9dhhNh9WGYgy7xIY5LmO6/view?usp=drive_link",
        rating: 4.8,
        language: "Español",
        pages: 168,
        publicationYear: 1946,
      },
      {
        numericId: 8,
        title: "Revelión en la granja",
        author: "George Orwell",
        description:
          "Una visión política que critica el totalitarismo y la corrupción del poder. A través de una granja donde los animales se rebelan contra sus dueños humanos, Orwell explora temas de opresión, propaganda y la traición de ideales. La obra es una reflexión sobre la naturaleza humana y la lucha por la libertad.",
        category: "Critica política",
        coverImage:
          "https://0.academia-photos.com/attachment_thumbnails/55100183/mini_magick20190115-13398-1izguib.png?1547561942",
        driveLink:
          "https://drive.google.com/file/d/1qidY97Z7GspvCcuObhURIFnb1lHYLeeN/view?usp=drive_link",
        rating: 4.8,
        language: "Español",
        pages: 152,
        publicationYear: 1945,
      },
      {
        numericId: 9,
        title: "La Ley 50",
        author: "Robert Greene, 50 Cent",
        description:
          "Una colaboración única entre el maestro de la estrategia Robert Greene y el icónico rapero 50 Cent. El libro aplica las leyes del poder al mundo del hip-hop y los negocios, mostrando cómo 50 Cent utilizó estrategias de poder para construir su imperio musical y empresarial.",
        category: "Psicología",
        coverImage:
          "https://m.media-amazon.com/images/I/71P2y6clnTL._UF1000,1000_QL80_.jpg",
        driveLink:
          "https://drive.google.com/file/d/1u72eQ-WBnkrqm1cCVX5dBAXERzflkNph/view?usp=share_link",
        rating: 4.6,
        language: "Español",
        pages: 304,
        publicationYear: 2009,
      },
      {
        numericId: 10,
        title: "Timeo",
        author: "Platón",
        description:
          "Uno de los diálogos más complejos de Platón que aborda la cosmología, la naturaleza del universo y la creación. Presenta la famosa alegoría de la Atlántida y desarrolla una teoría sobre la estructura matemática del cosmos, influyendo profundamente en el pensamiento occidental sobre la naturaleza de la realidad.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/360x360/87/4d/874d9475370c20db3936ab8aa0ef4a9b.jpg",
        driveLink:
          "https://drive.google.com/file/d/1G-f8JwXJL2TGTI0X1SePmqP0Q9wiKUEk/view?usp=share_link",
        rating: 4.3,
        language: "Español",
        pages: 208,
        publicationYear: -360,
      },
      {
        numericId: 11,
        title: "La República",
        author: "Platón",
        description:
          "La obra más famosa e influyente de Platón, un diálogo sobre la justicia y el estado ideal. Contiene la célebre alegoría de la caverna, la teoría de las Ideas y el concepto del filósofo-rey. Una piedra angular de la filosofía política occidental que sigue siendo relevante hoy en día.",
        category: "Filosofía",
        coverImage:
          "https://storage-aws-production.publica.la/bookwire-direct-sales/issues/2024/08/QNmThEUeUacMePxA/33df23ab-ca71-4c98-8af0-30e221939940_cover.jpg",
        driveLink:
          "https://drive.google.com/file/d/1jvXCUeoRtE2CKdmW-3k8nEsfdyij1D3q/view?usp=share_link",
        rating: 4.7,
        language: "Español",
        pages: 448,
        publicationYear: -380,
      },
      {
        numericId: 12,
        title: "El Alquimista",
        author: "Paulo Coelho",
        description:
          "Una fábula filosófica sobre Santiago, un joven pastor andaluz que viaja desde España hasta Egipto en busca de un tesoro. La novela explora temas universales como el destino, los sueños personales y la búsqueda del propósito de vida. Un bestseller mundial que ha inspirado a millones de lectores.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/520x520/01/8e/018eda7c5353d6309dec7992b63096a7.jpg",
        driveLink:
          "https://drive.google.com/file/d/1Df-__fwcxAWVyiBAw4VN0rOskLHLnsJZ/view?usp=share_link",
        rating: 4.5,
        language: "Español",
        pages: 192,
        publicationYear: 1988,
      },
      {
        numericId: 13,
        title: "El Kybalion",
        author: "Tres Iniciados",
        description:
          "Una obra que presenta los principios fundamentales de la filosofía hermética atribuida a Hermes Trismegisto. Explora los siete principios herméticos universales: mentalismo, correspondencia, vibración, polaridad, ritmo, causa y efecto, y género. Un texto esotérico que ha influido en numerosas tradiciones espirituales.",
        category: "Filosofía",
        coverImage:
          "https://www.planetadelibros.com.uy/usuaris/libros/fotos/360/m_libros/359350_portada_el-kybalion_los-tres-iniciados_202206132048.jpg",
        driveLink:
          "https://drive.google.com/file/d/12zHo8d2M3fxsttL6LWmkJXvCNFiEjE43/view?usp=share_link",
        rating: 4.4,
        language: "Español",
        pages: 144,
        publicationYear: 1908,
      },
      {
        numericId: 14,
        title: "La Conquista del Templo",
        author: "Jacobo Grinberg Zylberbaum",
        description:
          "Una exploración profunda de la conciencia y la realidad desde la perspectiva de la neuropsicología transpersonal. Grinberg combina investigación científica con experiencias místicas, presentando un modelo revolucionario de la conciencia que desafía los paradigmas convencionales de la neurociencia.",
        category: "Neurociencia",
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1625989854i/58531440.jpg",
        driveLink:
          "https://drive.google.com/file/d/1iozTbNL5nusNY4Oqj5BtNXGjSJzYQUFf/view?usp=share_link",
        rating: 4.6,
        language: "Español",
        pages: 224,
        publicationYear: 1991,
      },
      {
        numericId: 15,
        title: "Psicología de las Masas y Análisis del Yo",
        author: "Sigmund Freud",
        description:
          "Freud analiza los mecanismos psicológicos que operan en los grupos y las masas, explorando cómo la individualidad se disuelve en la psicología colectiva. Examina los fenómenos de identificación, liderazgo y la regresión del yo en situaciones grupales, sentando las bases de la psicología social.",
        category: "Psicoanalisis",
        coverImage:
          "https://m.media-amazon.com/images/I/61dICxDTmBL._AC_UF1000,1000_QL80_.jpg",
        driveLink:
          "https://drive.google.com/file/d/1l21iVey2WVZG_NEszUiFU11KJ6wJQYKS/view?usp=share_link",
        rating: 4.5,
        language: "Español",
        pages: 176,
        publicationYear: 1921,
      },
      {
        numericId: 16,
        title: "El Superhombre y la Voluntad de Poder",
        author: "Friedrich Nietzsche",
        description:
          "Una compilación de los conceptos centrales de Nietzsche sobre el Übermensch (superhombre) y la voluntad de poder. Explora la idea de la auto-superación humana, la creación de valores propios y el rechazo de la moral tradicional. Una introducción accesible a los conceptos más revolucionarios del filósofo alemán.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/360x360/e8/04/e8044acb96158c0277f694f9ddd35f7d.jpg",
        driveLink:
          "https://drive.google.com/file/d/10SVeK-9tXIOkTivQBwGu8qntFlqncznG/view?usp=share_link",
        rating: 4.6,
        language: "Español",
        pages: 288,
        publicationYear: 1883,
      },
      {
        numericId: 17,
        title: "Más Allá del Bien y del Mal",
        author: "Friedrich Nietzsche",
        description:
          "Una crítica radical de la moral tradicional y los prejuicios filosóficos de Occidente. Nietzsche propone una filosofía 'más allá del bien y del mal', explorando la naturaleza de la verdad, la moralidad y el conocimiento. Una obra fundamental para entender el perspectivismo nietzscheano.",
        category: "Filosofía",
        coverImage:
          "https://image.cdn1.buscalibre.com/5b59bcc11dc861e45f8b456b.RS500x500.jpg",
        driveLink:
          "https://drive.google.com/file/d/1NQEkUqqbGQ7sWVlpwfEmaTY16LO2f0ax/view?usp=share_link",
        rating: 4.7,
        language: "Español",
        pages: 256,
        publicationYear: 1886,
      },
      {
        numericId: 18,
        title: "Así Habló Zaratustra",
        author: "Friedrich Nietzsche",
        description:
          "La obra más poética y simbólica de Nietzsche, presentada como una parodia filosófica de los textos religiosos. A través del profeta Zaratustra, Nietzsche proclama la 'muerte de Dios' y presenta sus ideas sobre el superhombre, el eterno retorno y la voluntad de poder en un estilo literario único.",
        category: "Filosofía",
        coverImage:
          "https://editorialverbum.es/wp-content/uploads/2019/09/Así-habló.jpg",
        driveLink:
          "https://drive.google.com/file/d/1FVbzOULUw4vNSz9KV0RjuPpcwPqDuUDy/view?usp=share_link",
        rating: 4.8,
        language: "Español",
        pages: 432,
        publicationYear: 1883,
      },
      {
        numericId: 19,
        title: "El Anticristo",
        author: "Friedrich Nietzsche",
        description:
          "Una feroz crítica al cristianismo y su impacto en la cultura occidental. Nietzsche argumenta que el cristianismo ha debilitado la humanidad, promoviendo valores de debilidad y resentimiento. Una obra provocativa que desafía las bases morales y religiosas de la civilización occidental.",
        category: "Filosofía",
        coverImage:
          "https://covers.storytel.com/jpg-640/9783967245202.6e12b469-f127-4280-966a-4cc01f5cfced?optimize=high&quality=70&width=600",
        driveLink:
          "https://drive.google.com/file/d/1vtXABQikW8XanQ0g1fAy9S2aB_jBbojH/view?usp=share_link",
        rating: 4.4,
        language: "Español",
        pages: 144,
        publicationYear: 1888,
      },
      {
        numericId: 20,
        title: "Humano, Demasiado Humano",
        author: "Friedrich Nietzsche",
        description:
          "Marca el período 'ilustrado' de Nietzsche, donde adopta un enfoque más científico y psicológico. Analiza la naturaleza humana, la moral, la religión y el arte desde una perspectiva crítica y desmitificadora. Una obra de transición que muestra la evolución del pensamiento nietzscheano.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn1.buscalibre.com/fit-in/360x360/5d/8e/5d8e8a8c1930c3a514f125c260830aa0.jpg",
        driveLink:
          "https://drive.google.com/file/d/1oY4QdLBBNmGY5R24mOxovdvnSValYAnP/view?usp=share_link",
        rating: 4.5,
        language: "Español",
        pages: 384,
        publicationYear: 1878,
      },
      {
        numericId: 21,
        title: "La Gaya Ciencia",
        author: "Friedrich Nietzsche",
        description:
          "Una colección de aforismos que explora temas como la muerte de Dios, el nihilismo y la necesidad de crear nuevos valores. Nietzsche introduce conceptos como el eterno retorno y desarrolla su crítica de la moral tradicional con un estilo alegre y provocativo.",
        category: "Filosofía",
        coverImage:
          "https://http2.mlstatic.com/D_NQ_NP_671845-MLU69945133166_062023-O.webp",
        driveLink:
          "https://drive.google.com/file/d/1VFF4onRZ5jM71hj2Us6yaVQNv35V9go4/view?usp=share_link",
        rating: 4.6,
        language: "Español",
        pages: 320,
        publicationYear: 1882,
      },
      {
        numericId: 22,
        title: "La Genealogía de la Moral",
        author: "Friedrich Nietzsche",
        description:
          "Un análisis histórico y psicológico de los valores morales occidentales. Nietzsche examina el origen de conceptos como 'bueno', 'malo', 'culpa' y 'mala conciencia', revelando cómo la moral cristiana emerge del resentimiento de los débiles hacia los fuertes.",
        category: "Filosofía",
        coverImage:
          "https://www.tecnos.es/imagenes/libros/grande/9788430989256-de-la-genealogia-de-la-moral.jpg",
        driveLink:
          "https://drive.google.com/file/d/1ENtcbs1mIqNSyeDtRb0bz26jrPxAI2GI/view?usp=share_link",
        rating: 4.7,
        language: "Español",
        pages: 224,
        publicationYear: 1887,
      },
      {
        numericId: 23,
        title: "No Tengo Boca y Debo Gritar",
        author: "Harlan Ellison",
        description:
          "Una colección de relatos de ciencia ficción que incluye la famosa historia que da título al libro. Ellison explora temas distópicos sobre la tecnología, la inteligencia artificial y la deshumanización con un estilo visceral y provocativo. Una obra maestra del horror psicológico y la ciencia ficción.",
        category: "Ciencia Ficción",
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1714589896i/26371909.jpg",
        driveLink:
          "https://drive.google.com/file/d/1qH6ice1lyHYtyn7cD377DfetM5JGNTUY/view?usp=share_link",
        rating: 4.5,
        language: "Español",
        pages: 288,
        publicationYear: 1967,
      },
      {
        numericId: 24,
        title: "Siddhartha",
        author: "Hermann Hesse",
        description:
          "Una novela filosófica sobre la búsqueda espiritual de Siddhartha, inspirada en la vida de Buda pero presentando un camino único hacia la iluminación. Hesse explora temas de autodescubrimiento, sabiduría y la tensión entre conocimiento intelectual y experiencia vivida.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/360x360/97/82/97822208af909f07ea67963d470b5171.jpg",
        driveLink:
          "https://drive.google.com/file/d/1CrlLY3V1Xhc48eDkR2IU5VQ4nC3-F5sM/view?usp=share_link",
        rating: 4.6,
        language: "Español",
        pages: 160,
        publicationYear: 1922,
      },
      {
        numericId: 25,
        title: "El Código Da Vinci",
        author: "Dan Brown",
        description:
          "Un thriller que combina arte, historia y misterio religioso. El profesor Robert Langdon debe resolver un asesinato en el Louvre que lo lleva a descubrir secretos sobre el Santo Grial y la Iglesia Católica. Un bestseller que generó controversia por sus teorías sobre el cristianismo primitivo.",
        category: "Misterio",
        coverImage:
          "https://images.cdn2.buscalibre.com/fit-in/360x360/49/54/4954e233ad1e1a43e3f8187cd91c6997.jpg",
        driveLink:
          "https://drive.google.com/file/d/1pQn_apLNlAK3boCP4uscTuI2zBpooP2W/view?usp=share_link",
        rating: 4.3,
        language: "Español",
        pages: 656,
        publicationYear: 2003,
      },
      {
        numericId: 26,
        title: "La Conspiración",
        author: "Dan Brown",
        description:
          "Robert Langdon se ve envuelto en una conspiración mortal relacionada con los Illuminati y el Vaticano. Una carrera contra el tiempo que combina ciencia, religión y símbolos antiguos en una trama que amenaza la propia Ciudad del Vaticano. El primer libro protagonizado por Langdon.",
        category: "Misterio",
        coverImage:
          "https://images.cdn3.buscalibre.com/fit-in/360x360/c7/0e/c70ed9b615161a40c1e0d6d86fdb5835.jpg",
        driveLink:
          "https://drive.google.com/file/d/1FXaO8OgDzYMHYC4kBocw07OJXMySNZCG/view?usp=share_link",
        rating: 4.4,
        language: "Español",
        pages: 624,
        publicationYear: 2000,
      },
      {
        numericId: 27,
        title: "La Fortaleza Digital",
        author: "Dan Brown",
        description:
          "Un thriller tecnológico sobre criptografía y seguridad nacional. Cuando la NSA no puede descifrar un código aparentemente inquebrantable, se desata una carrera para evitar una catástrofe que podría comprometer la seguridad de Estados Unidos. Una exploración de la privacidad en la era digital.",
        category: "Misterio",
        coverImage:
          "https://images.cdn3.buscalibre.com/fit-in/360x360/46/f5/46f5ff901c5ce8ef42536784187872f2.jpg",
        driveLink:
          "https://drive.google.com/file/d/1IHrVjkVSHHP2cMRI8jqHF3yR_cM8ou6o/view?usp=share_link",
        rating: 4.2,
        language: "Español",
        pages: 432,
        publicationYear: 1998,
      },
      {
        numericId: 28,
        title: "Origen",
        author: "Dan Brown",
        description:
          "Robert Langdon investiga las preguntas fundamentales sobre el origen y destino de la humanidad cuando su mentor es asesinado antes de presentar un descubrimiento revolucionario. Una mezcla de ciencia, religión y tecnología ambientada en España, explorando temas de evolución y inteligencia artificial.",
        category: "Misterio",
        coverImage:
          "https://www.planetadelibros.com.uy/usuaris/libros/fotos/263/m_libros/262507_portada_origen_dan-brown_201709111715.jpg",
        driveLink:
          "https://drive.google.com/file/d/1tl-WwZszyQuRIJGHJ4YLKBLjBGeC3F4d/view?usp=share_link",
        rating: 4.1,
        language: "Español",
        pages: 576,
        publicationYear: 2017,
      },
      {
        numericId: 29,
        title: "El Extranjero",
        author: "Albert Camus",
        description:
          "La novela existencialista más famosa de Camus. Meursault, un empleado de oficina argelino, comete un asesinato aparentemente sin motivo y enfrenta las consecuencias con una indiferencia que desafía las expectativas sociales. Una exploración profunda del absurdismo y la condición humana.",
        category: "Filosofía",
        coverImage:
          "https://images.cdn3.buscalibre.com/fit-in/360x360/ed/78/ed78b980a9c6035d780e8a31e928ba91.jpg",
        driveLink:
          "https://drive.google.com/file/d/1OQSBkO6k7A6GMlKoTBUNkQEcH52O2UIO/view?usp=share_link",
        rating: 4.5,
        language: "Español",
        pages: 144,
        publicationYear: 1942,
      },
    ];

    let migrated = 0;
    let existing = 0;
    let errors = 0;

    for (const bookData of completeBooks) {
      try {
        // Verificar si el libro ya existe
        const existingBook = await Book.findOne({
          numericId: bookData.numericId,
        });

        if (!existingBook) {
          // Crear nuevo libro
          const newBook = new Book(bookData);
          await newBook.save();
          console.log(`✅ Migrado: ${bookData.title}`);
          migrated++;
        } else {
          console.log(`⚠️ Ya existe: ${bookData.title}`);
          existing++;
        }
      } catch (error) {
        console.error(`❌ Error con ${bookData.title}:`, error.message);
        errors++;
      }
    }

    // Reinicializar búsqueda con todos los libros
    const allBooks = await Book.find().lean();
    searchService.initializeSearch(allBooks);

    res.status(200).json({
      success: true,
      message: "Migración completada",
      stats: {
        totalProcessed: completeBooks.length,
        migrated,
        existing,
        errors,
        finalTotal: allBooks.length,
      },
    });
  } catch (error) {
    console.error("❌ Error en migración:", error);
    res.status(500).json({
      success: false,
      message: "Error en la migración",
      error: error.message,
    });
  }
};
