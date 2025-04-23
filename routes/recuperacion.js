// routes/recuperacionRoutes.js
const express = require('express');
const app = express.Router();
const recuperacionController = require('../controllers/recuperacionController');
// Importar middlewares desde el archivo único
const {validarSolicitud,validarToken,validarRestablecimiento,noAutenticado,} = require('../middlewares/validacionRecuperarContrasenna');

// Solicitar recuperación de contraseña
app.post('/solicitar',noAutenticado, validarSolicitud, recuperacionController.solicitarRecuperacionContrasenna);

// Validar el token de recuperación
app.post('/validar',noAutenticado, validarToken, recuperacionController.validarTokenRecuperacion);

// Restablecer la contraseña
app.post('/restablecer',validarRestablecimiento, recuperacionController.restablecerContrasenna);

module.exports = app;