const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Pasajero = require('../models/pasajero');
const Conductor = require('../models/conductor');
const Usuario = require('../models/usuario');
const { SEED } = require('../config/config');
require('dotenv').config();
// console.log('Entorno actual:', process.env.NODE_ENV);

// exports.login = async (req, res) => {
//     const { correo, contrasenna } = req.body;

//     try {
//         // 1. Buscar en todos los modelos en paralelo
//         const [pasajero, conductor, admin] = await Promise.all([
//             Pasajero.findOne({ correo }).select('+contrasenna').exec(),
//             Conductor.findOne({ correo }).select('+contrasenna').exec(),
//             Usuario.findOne({ correo }).select('+contrasenna').exec()
//         ]);

//         const usuario = pasajero || conductor || admin;

//         // 2. Validar existencia y contraseña
//         if (!usuario || !bcrypt.compareSync(contrasenna, usuario.contrasenna)) {
//             return res.status(400).json({
//                 ok: false,
//                 mensaje: 'Credenciales incorrectas',
//                 errors: { message: 'Correo o contraseña inválidos' }
//             });
//         }

//         // 3. Determinar tipo de usuario
//         let tipoUsuario;
//         if (usuario instanceof Pasajero) tipoUsuario = 'pasajero';
//         if (usuario instanceof Conductor) tipoUsuario = 'conductor';
//         if (usuario instanceof Usuario) tipoUsuario = 'admin';

//         // 4. Generar token
//         const token = jwt.sign(
//             { 
//                 id: usuario._id, 
//                 tipoUsuario,
//                 role: usuario.role || null
//             }, 
//             SEED, 
//             { expiresIn: '8h' }
//         );

//         // 5. Preparar respuesta
//         usuario.contrasenna = undefined;
//         res.json({
//             ok: true,
//             usuario: {
//                 ...usuario.toObject(),
//                 tipo: tipoUsuario
//             },
//             token
//         });

//     } catch (error) {
//         console.error('Error en login:', error);
//         res.status(500).json({
//             ok: false,
//             mensaje: 'Error inesperado',
//           //  errors: process.env.NODE_ENV === 'development' ? error : {}
//         });
//     }
// };




//====================================================================
//    Login con refreshToken
//====================================================================
// Función para determinar si el valor es un correo electrónico
const esCorreo = (valor) => {
    return /^\S+@\S+\.\S+$/.test(valor);
};

// Función para determinar si el valor es un número de teléfono
const esTelefono = (valor) => {
    return /^\d+$/.test(valor); // Ajusta esta expresión regular según el formato de tu teléfono
};

exports.login = async (req, res) => {
    const { usuario, contrasenna } = req.body; // Cambiamos 'correo' por 'usuario' para ser más genéricos

    if (!usuario || !contrasenna) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Se requieren el usuario (correo/teléfono) y la contraseña',
        });
    }

    try {
        let query;
        if (esCorreo(usuario)) {
            query = { correo: usuario };
        } else if (esTelefono(usuario)) {
            query = { telefono: usuario };
        } else {
            return res.status(400).json({
                ok: false,
                mensaje: 'Formato de usuario no válido. Use correo o teléfono',
            });
        }

        // Buscar en todos los modelos en paralelo
        const [pasajero, conductor, admin] = await Promise.all([
            Pasajero.findOne(query).select('+contrasenna').exec(),
            Conductor.findOne(query).select('+contrasenna').exec(),
            Usuario.findOne(query).select('+contrasenna').exec(),
        ]);

        const usuarioEncontrado = pasajero || conductor || admin;

        // Validar existencia y contraseña
        if (!usuarioEncontrado || !bcrypt.compareSync(contrasenna, usuarioEncontrado.contrasenna)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas',
                errors: { message: 'Usuario o contraseña inválidos' },
            });
        }

        // Determinar tipo de usuario
        let tipoUsuario;
        if (usuarioEncontrado instanceof Pasajero) tipoUsuario = 'pasajero';
        if (usuarioEncontrado instanceof Conductor) tipoUsuario = 'conductor';
        if (usuarioEncontrado instanceof Usuario) tipoUsuario = 'admin';

        // Generar token de acceso
        const token = jwt.sign(
            {
                id: usuarioEncontrado._id,
                tipoUsuario,
                role: usuarioEncontrado.role || null,
            },
            SEED,
            { expiresIn: '5m' } // Token de acceso válido por 5 minutos
        );

        // Generar refresh token
        const refreshToken = jwt.sign(
            { id: usuarioEncontrado._id, tipoUsuario },
            SEED,
            { expiresIn: '7d' } // Refresh token válido por 7 días
        );

        // Guardar refreshToken en la base de datos
        usuarioEncontrado.refreshToken = refreshToken;
        await usuarioEncontrado.save();
        //Para q sea dinamico el secure 
        //const isProduction = process.env.NODE_ENV === 'production';
        // Preparar respuesta
        usuarioEncontrado.contrasenna = undefined;
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
           // secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            path: '/',
        }).json({
            ok: true,
            usuario: {
                ...usuarioEncontrado.toObject(),
                tipo: tipoUsuario,
            },
            token,
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado',
        });
    }
};
// exports.login = async (req, res) => {
//     const { correo, contrasenna } = req.body;

//     try {
//         // 1. Buscar en todos los modelos en paralelo
//         const [pasajero, conductor, admin] = await Promise.all([
//             Pasajero.findOne({ correo }).select('+contrasenna').exec(),
//             Conductor.findOne({ correo }).select('+contrasenna').exec(),
//             Usuario.findOne({ correo }).select('+contrasenna').exec()
//         ]);

//         const usuario = pasajero || conductor || admin;

//         // 2. Validar existencia y contraseña
//         if (!usuario || !bcrypt.compareSync(contrasenna, usuario.contrasenna)) {
//             return res.status(400).json({
//                 ok: false,
//                 mensaje: 'Credenciales incorrectas',
//                 errors: { message: 'Correo o contraseña inválidos' }
//             });
//         }

//         // 3. Determinar tipo de usuario
//         let tipoUsuario;
//         if (usuario instanceof Pasajero) tipoUsuario = 'pasajero';
//         if (usuario instanceof Conductor) tipoUsuario = 'conductor';
//         if (usuario instanceof Usuario) tipoUsuario = 'admin';

//         // 4. Generar token de acceso
//         const token = jwt.sign(
//             { 
//                 id: usuario._id, 
//                 tipoUsuario,
//                 role: usuario.role || null
//             }, 
//             SEED, 
//             { expiresIn: '1m' } // Token de acceso válido por 15 minutos
//         );

//         // 5. Generar refresh token
//         const refreshToken = jwt.sign(
//             { id: usuario._id, tipoUsuario },
//             SEED,
//             { expiresIn: '7d' } // Refresh token válido por 7 días
//         );


//         // 6. Preparar respuesta
//         usuario.contrasenna = undefined;
//         res.cookie('refreshToken', refreshToken, {
//             httpOnly: true,
//             // secure: process.env.NODE_ENV === 'production', // Solo enviar en HTTPS en producción
//             secure: false,
//             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
//             path: '/'
//             // domain: 'localhost' // Especifica el dominio sin el puerto
//         }).json({
//             ok: true,
//             usuario: {
//                 ...usuario.toObject(),
//                 tipo: tipoUsuario
//             },
//             token
//         });

//     } catch (error) {
//         console.error('Error en login:', error);
//         res.status(500).json({
//             ok: false,
//             mensaje: 'Error inesperado',
//         });
//     }
// };

//====================================================================
//   logout
//====================================================================
// Función de logout
exports.logout = (req, res) => {
    try {
        console.log('Cookies recibidas:', req.cookies);
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se encontró el refreshToken en las cookies'
            });
        }

        // Eliminar la cookie correctamente
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/'
        });

        // Enviar una cookie expirada para mayor seguridad
        res.cookie('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            expires: new Date(0),
            path: '/'
        });

        console.log('Cookie refreshToken eliminada');

        res.status(200).json({
            ok: true,
            mensaje: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al cerrar sesión'
        });
    }
};
// exports.logout = (req, res) => {
//     try {
//         console.log('Cookies recibidas:', req.cookies); // Depuración
//         const refreshToken = req.cookies?.refreshToken;

//         if (!refreshToken) {
//             return res.status(400).json({
//                 ok: false,
//                 mensaje: 'No se encontró el refreshToken en las cookies'
//             });
//         }

//         // Eliminar la cookie del cliente
//         res.clearCookie('refreshToken', {
//             httpOnly: true,
//             // secure: process.env.NODE_ENV === 'production',
//             secure: false,
//             path: '/'
//             // domain: 'localhost' // Especifica el dominio sin el puerto
//         });

//         console.log('Cookie refreshToken eliminada'); // Depuración

//         res.status(200).json({
//             ok: true,
//             mensaje: 'Sesión cerrada exitosamente'
//         });
//     } catch (error) {
//         console.error('Error en logout:', error);
//         res.status(500).json({
//             ok: false,
//             mensaje: 'Error al cerrar sesión'
//         });
//     }
// };



//====================================================================
//   Renovar Token
//====================================================================
exports.renovarToken = async (req, res) => {
    console.log('Cuerpo de la solicitud:', req.body); // Depuración
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Refresh token no proporcionado'
        });
    }

    try {
        // Verificar el token de actualización
        const decoded = jwt.verify(refreshToken, SEED);

        // Emitir un nuevo token de acceso
        const nuevoToken = jwt.sign(
            { id: decoded.id, tipoUsuario: decoded.tipoUsuario },
            SEED,
            { expiresIn: '1h' } // Token de acceso válido por 1 hora
        );

        res.status(200).json({
            ok: true,
            token: nuevoToken
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({
            ok: false,
            mensaje: 'Token de actualización inválido o expirado'
        });
    }
};
// Renover token usar este 
// exports.renovarToken = async (req, res) => {
//     console.log('Cuerpo de la solicitud:', req.cookies);
//     const refreshToken = req.cookies?.refreshToken; // Obtenerlo de las cookies

//     if (!refreshToken) {
//         return res.status(400).json({
//             ok: false,
//             mensaje: 'Refresh token no proporcionado'
//         });
//     }

//     try {
//         // Verificar el refreshToken
//         const decoded = jwt.verify(refreshToken, SEED);

//         // Generar solo un nuevo token de acceso
//         const nuevoToken = jwt.sign(
//             { id: decoded.id, tipoUsuario: decoded.tipoUsuario },
//             SEED,
//             { expiresIn: '1h' } // Token de acceso válido por 1 hora
//         );

//         res.status(200).json({
//             ok: true,
//             token: nuevoToken
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(401).json({
//             ok: false,
//             mensaje: 'Refresh token inválido o expirado'
//         });
//     }
// };

// Renovar token mejorado igual q el de arriba pero genera token por cada solicitud no es tan conveniente como el q esta comentado arriba 
// exports.renovarToken = async (req, res) => {
//     console.log('Cuerpo de la solicitud:', req.cookies);
//     const refreshToken = req.cookies?.refreshToken; // Obtener de las cookies

//     if (!refreshToken) {
//         return res.status(400).json({
//             ok: false,
//             mensaje: 'Refresh token no proporcionado'
//         });
//     }

//     try {
//         // Verificar el token de actualización
//         const decoded = jwt.verify(refreshToken, SEED);

//         // Emitir un nuevo token de acceso
//         const nuevoToken = jwt.sign(
//             { id: decoded.id, tipoUsuario: decoded.tipoUsuario },
//             SEED,
//             { expiresIn: '1h' } // Token de acceso válido por 1 hora
//         );

//         // Generar un nuevo refreshToken
//         const nuevoRefreshToken = jwt.sign({ id: decoded.id }, SEED, { expiresIn: '7d' });

//         // Configurar la nueva cookie con el refreshToken
//         res.cookie('refreshToken', nuevoRefreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'Strict',
//             path: '/'
//         });

//         res.status(200).json({
//             ok: true,
//             token: nuevoToken
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(401).json({
//             ok: false,
//             mensaje: 'Token de actualización inválido o expirado'
//         });
//     }
// };


