// controllers/recuperacionController.js
// const bcrypt = require('bcrypt');
var bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Pasajero = require('../models/pasajero');
const Conductor = require('../models/conductor');
const transporter = require('../config/mailer');

// Generar un token único
function generarToken() {
    return crypto.randomBytes(20).toString('hex'); // Token de 40 caracteres
}

// Solicitar recuperación de contraseña
exports.solicitarRecuperacionContrasenna = async (req, res) => {
    const { correo } = req.body;

    try {
        // Buscar al usuario (pasajero o conductor) por correo
        const pasajero = await Pasajero.findOne({ correo });
        const conductor = await Conductor.findOne({ correo });
        const usuario = pasajero || conductor;

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'No se encontró un usuario con ese correo'
            });
        }

        // Generar token y fecha de expiración (1 hora)
        const token = generarToken();
        usuario.resetPasswordToken = token;
        usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora

        await usuario.save();

        // Enviar el token por correo electrónico
        const mailOptions = {
            to: usuario.correo,
            subject: 'Recuperación de Contraseña',
            text: `Hola ${usuario.nombre},\n\n` +
                  `Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:\n\n` +
                  `${token}\n\n` +
                  `Este código expirará en 1 hora.\n\n` +
                  `Si no solicitaste este cambio, ignora este mensaje.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            ok: true,
            mensaje: 'Se ha enviado un código de recuperación a tu correo'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al solicitar recuperación de contraseña',
            errors: error.message
        });
    }
};

// Validar el token de recuperación
exports.validarTokenRecuperacion = async (req, res) => {
    const { token } = req.body;

    try {
        // Buscar al usuario (pasajero o conductor) por token
        const pasajero = await Pasajero.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Verificar que no haya expirado
        });
        const conductor = await Conductor.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        const usuario = pasajero || conductor;

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El código es inválido o ha expirado'
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: 'Código válido',
            usuarioId: usuario._id // Devolver el ID del usuario para el siguiente paso
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al validar el código',
            errors: error.message
        });
    }
};

// Restablecer la contraseña
exports.restablecerContrasenna = async (req, res) => {
    const { usuarioId, nuevaContrasenna } = req.body;

    try {
        // Buscar al usuario (pasajero o conductor) por ID
        const pasajero = await Pasajero.findById(usuarioId);
        const conductor = await Conductor.findById(usuarioId);
        const usuario = pasajero || conductor;

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Encriptar la nueva contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nuevaContrasenna, saltRounds);

        // Actualizar la contraseña y limpiar el token
        usuario.contrasenna = hashedPassword;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;

        await usuario.save();

        res.status(200).json({
            ok: true,
            mensaje: 'Contraseña restablecida exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al restablecer la contraseña',
            errors: error.message
        });
    }
};



// Flujo
// Flujo de Recuperación de Contraseña
// Solicitud de Recuperación:

// El usuario ingresa su correo electrónico en un formulario de recuperación de contraseña.

// Se envía una solicitud POST al endpoint /api/recuperacion/solicitar con el correo electrónico.

// Generación del Token:

// El backend busca al usuario por su correo electrónico.

// Si el usuario existe, se genera un token temporal (resetPasswordToken) y se establece una fecha de expiración (resetPasswordExpires).

// El token se envía al correo electrónico del usuario.

// Validación del Token:

// El usuario ingresa el token que recibió en su correo.

// Se envía una solicitud POST al endpoint /api/recuperacion/validar con el token.

// El backend verifica que el token sea válido y que no haya expirado.

// Restablecimiento de Contraseña:

// Si el token es válido, el usuario puede ingresar una nueva contraseña.

// Se envía una solicitud POST al endpoint /api/recuperacion/restablecer con el ID del usuario y la nueva contraseña.

// El backend actualiza la contraseña en la base de datos y limpia el token temporal.