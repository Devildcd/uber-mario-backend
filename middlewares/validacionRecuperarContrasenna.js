const { body, validationResult } = require('express-validator');

// Función para manejar la validación y errores
const validar = (validaciones) => {
  return async (req, res, next) => {
    await Promise.all(validaciones.map((validacion) => validacion.run(req)));

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    next();
  };
};

// Middleware para validar la solicitud de recuperación de contraseña
const validarSolicitud = validar([
  body('correo')
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
]);

// Middleware para validar el token de recuperación
const validarToken = validar([
  body('token')
    .notEmpty().withMessage('El token es requerido')
]);

// Middleware para validar el restablecimiento de la contraseña
const validarRestablecimiento = validar([
  body('usuarioId')
    .notEmpty().withMessage('El ID de usuario es requerido'),
  body('nuevaContrasenna')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
]);

// Middleware para verificar si el usuario ya está autenticado
const noAutenticado = (req, res, next) => {
    if (req.cookies?.refreshToken) { // Verificando refreshToken en lugar de token
      return res.status(400).json({
        ok: false,
        mensaje: 'Ya estás autenticado. Cierra sesión para continuar.',
      });
    }
    next();
  };
// const noAutenticado = (req, res, next) => {
//   if (req.cookies?.token) {
//     return res.status(400).json({
//       ok: false,
//       mensaje: 'Ya estás autenticado. Cierra sesión para continuar.',
//     });
//   }
//   next();
// };

// Exportar todos los middlewares
module.exports = {
  validarSolicitud,
  validarToken,
  validarRestablecimiento,
  noAutenticado,
};


// // middleware/recuperacionMiddleware.js
// const { body } = require('express-validator');

// // Middleware para validar la solicitud de recuperación de contraseña
// const validarSolicitud = [
//   body('correo')
//     .isEmail().withMessage('Debe ser un correo válido')
//     .notEmpty().withMessage('El correo es requerido'),
// ];

// // Middleware para validar el token de recuperación
// const validarToken = [
//   body('token')
//     .notEmpty().withMessage('El token es requerido'),
// ];

// // Middleware para validar el restablecimiento de la contraseña
// const validarRestablecimiento = [
//   body('usuarioId')
//     .notEmpty().withMessage('El ID de usuario es requerido'),
//   body('nuevaContrasenna')
//     .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
//     .notEmpty().withMessage('La nueva contraseña es requerida'),
// ];

// // Middleware para verificar si el usuario ya está autenticado
// const noAutenticado = (req, res, next) => {
//   if (req.cookies.token) {
//     return res.status(400).json({
//       ok: false,
//       mensaje: 'Ya estás autenticado. Cierra sesión para continuar.',
//     });
//   }
//   next();
// };

// // Exportar todos los middlewares
// module.exports = {
//   validarSolicitud,
//   validarToken,
//   validarRestablecimiento,
//   noAutenticado,
// };