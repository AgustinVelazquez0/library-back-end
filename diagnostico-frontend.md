# 🔍 Diagnóstico de Errores SyntaxError en Frontend

## ✅ Estado Actual del Sistema

- ✅ Backend Node.js: Funcionando correctamente en puerto 5000
- ✅ Nginx: Funcionando correctamente en puerto 80, proxy-eando al backend
- ✅ Frontend React: Corriendo en puerto 5173
- ❌ **PROBLEMA**: Frontend recibe HTML cuando espera JSON

## 🚨 Errores Observados

```
❌ Error al cargar libros desde API: SyntaxError: The string did not match the expected pattern - bookService.js:29
❌ Error al cargar datos desde la API: SyntaxError: The string did not match the expected pattern - Header.jsx:80
❌ Error al obtener usuario: SyntaxError: The string did not match the expected pattern - AuthContext.jsx:65
```

## 🔧 Pasos de Solución

### 1. Verifica las URLs en el Frontend

El frontend debe hacer requests a:

```javascript
// ✅ CORRECTO - A través de nginx
const API_BASE_URL = "http://localhost/api"; // Sin puerto, nginx maneja el proxy

// ❌ INCORRECTO - Directo al backend (problemas de CORS)
const API_BASE_URL = "http://localhost:5000/api";
```

### 2. Revisa tus archivos de servicio en el frontend

**En bookService.js (línea ~29):**

```javascript
// Ejemplo de implementación correcta
const fetchBooks = async () => {
  try {
    const response = await fetch("http://localhost/api/books");

    // Verifica que la respuesta sea OK antes de parsear
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Verifica que sea JSON antes de parsear
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Expected JSON, got: ${contentType}. Response: ${text.substring(
          0,
          100
        )}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en fetchBooks:", error);
    throw error;
  }
};
```

### 3. Verifica la configuración de autenticación

**En AuthContext.jsx (línea ~65):**

```javascript
// Si estás usando tokens JWT
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido, redirigir a login
        localStorage.removeItem("token");
        throw new Error("Token inválido");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};
```

### 4. Debugging en el Navegador

Abre las DevTools del navegador y en la pestaña **Network**:

1. Filtra por **XHR/Fetch**
2. Recarga la página
3. Busca las requests a `/api/*`
4. Haz clic en cada request y verifica:
   - **Status**: Debe ser 200, no 404 o 500
   - **Response Headers**: Debe incluir `Content-Type: application/json`
   - **Response**: Debe ser JSON, no HTML

### 5. Verificación de CORS en Development

Si estás usando Vite, asegúrate de que tu `vite.config.js` tenga:

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### 6. Variables de Entorno

Crea un archivo `.env` en tu frontend:

```env
# Para desarrollo
VITE_API_BASE_URL=http://localhost/api

# Para producción
# VITE_API_BASE_URL=https://tu-dominio.com/api
```

Y úsalo en tu código:

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/api";
```

## 🧪 Pruebas Rápidas

### Prueba 1: Verifica que nginx está proxy-eando

```bash
curl -v http://localhost/api/books
# Debe devolver JSON, no HTML
```

### Prueba 2: Verifica autenticación

```bash
# Primero haz login
curl -X POST http://localhost/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@example.com","password":"tu-password"}'

# Copia el token y úsalo
curl -H "Authorization: Bearer TU-TOKEN-AQUI" http://localhost/api/users/me
```

### Prueba 3: Verifica desde el frontend

En la consola del navegador:

```javascript
// Prueba directa en la consola
fetch("http://localhost/api/books")
  .then((response) => {
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));
    return response.text();
  })
  .then((text) => {
    console.log("Response (first 200 chars):", text.substring(0, 200));
    try {
      const json = JSON.parse(text);
      console.log("✅ JSON válido:", json);
    } catch (e) {
      console.log("❌ No es JSON válido:", e.message);
    }
  });
```

## 🎯 Solución Más Probable

Basándome en los errores, es muy probable que el problema sea:

1. **URLs incorrectas**: El frontend está haciendo fetch a URLs que devuelven HTML
2. **Tokens de autenticación**: Las requests a `/api/users/me` fallan y devuelven HTML de error
3. **Manejo de errores**: El código no verifica si la respuesta es JSON antes de parsearlo

## 📞 ¿Necesitas Ayuda?

Si el problema persiste:

1. Envía un screenshot de la pestaña Network en DevTools
2. Comparte el código de tus servicios (bookService.js, AuthContext.jsx)
3. Muestra la configuración de tu proyecto frontend (package.json, vite.config.js)
