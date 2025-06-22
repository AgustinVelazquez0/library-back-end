const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Endpoint de prueba
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API funcionando correctamente"
 */
router.get("/", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
