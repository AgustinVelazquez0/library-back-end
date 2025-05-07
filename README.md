# Backend - Proyecto **Library** con Node.js, Express, MongoDB

---

## Descripción del Proyecto

Este es el backend de la aplicación **corner-boos-log**. Está construido con **Node.js**, **Express.js** y la base de datos **MongoDB** para los libros y para la autenticación de usuarios. Además, utiliza **JWT** para la autenticación segura.

El backend proporciona rutas RESTful para interactuar con los libros y los usuarios, y se ejecuta en un servidor local en su rama main y está con su deploy en la rama **back** en el repo del **Front-End**.

### Requisitos Previos

Asegúrate de tener instalados los siguientes programas:

- **Node.js**: [Descargar aquí](https://nodejs.org/)
- **MongoDB**: Base de datos para tareas.

### Instrucciones de Instalación

#### 1. **Clonar el Repositorio del Backend:**

```bash
git clone git@github.com:AgustinVelazquez0/library-back-end.git
```

#### 2. **Levantar el servidor de Bases de Datos:**:

Para **MongoDB:** ejecuta node app.js y iniciará el servidor almacenado en MongoDB Atlas.

#### 3. **Instalar Dependencias del Backend:**

Navega al directorio del backend y ejecuta:

```bash
npm install
```

#### 4. **Iniciar el Servidor del Backend:**

Una vez que las dependencias estén instaladas, ejecuta:

```bash
node app.js
```

El servidor debería estar corriendo en `http://localhost:5000`.

## Front-End con React

Además, he desarrollado el Front-End para este proyecto utilizando React, el cual se encuentra en un repositorio separado y público. Este front-end permite navegar e interactuar con la web, Puedes explorar ese repositorio en el siguiente enlace: `https://github.com/AgustinVelazquez0/corner-books-log`

### Tecnologías Utilizadas

- **Node.js** y **Express.js**: Para el backend y manejo de rutas.
- **MongoDB**: Para la base de datos tanto de libros como de usuarios.
- **JWT**: Para autenticación de usuarios.
