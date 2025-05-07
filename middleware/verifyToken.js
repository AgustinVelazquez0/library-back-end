const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Obtenemos el token desde el encabezado "Authorization"
  const token = req.header("Authorization");

  console.log("Token recibido:", token); // Verifica lo que se recibe en el encabezado

  // Si no se proporciona token, respondemos con un error 401
  if (!token) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. No se proporcionó token." });
  }

  // El formato esperado es 'Bearer <token>', separamos el "Bearer" y obtenemos solo el token
  const tokenPart = token.split(" ")[1];

  // Verificamos si el token está bien formado
  if (!tokenPart) {
    return res.status(400).json({
      message: "Token mal formado. Asegúrate de usar 'Bearer <token>'.",
    });
  }

  console.log("Token después de separar 'Bearer':", tokenPart); // Verifica el valor del token

  try {
    // Verifica y decodifica el token usando la clave secreta
    const decoded = jwt.verify(tokenPart, process.env.JWT_SECRET); // Usa la clave secreta almacenada en .env
    req.user = decoded; // Guardamos la información del usuario decodificada en `req.user`
    next(); // Continuamos con la siguiente función (ruta)
  } catch (error) {
    console.error("Error al verificar el token:", error.message);
    return res
      .status(403)
      .json({ message: "Token inválido o expirado", error: error.message });
  }
};

module.exports = verifyToken;
