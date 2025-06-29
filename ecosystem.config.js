module.exports = {
  apps: [
    {
      name: "library-backend",
      script: "app.js",
      instances: "max", // Usa el número máximo de núcleos CPU disponibles
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
