const Pasajero = require('../models/pasajero');
const Conductor = require('../models/conductor');
const Valoracion = require('../models/valoracion'); 
var bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Importar uuid


// async function generarCodigoUnico(longitud = 8) {
//     const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let codigo;

//     do {
//         // Genera un código aleatorio
//         codigo = '';
//         for (let i = 0; i < longitud; i++) {
//             const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
//             codigo += caracteres.charAt(indiceAleatorio);
//         }

//         // Verifica si el código ya existe en los modelos
//         const existeEnPasajeros = await Pasajero.exists({ codigoUnico: codigo });
//         const existeEnConductores = await Conductor.exists({ codigoUnico: codigo });

//         if (!existeEnPasajeros && !existeEnConductores) {
//             // Si no existe, retorna el código
//             return codigo;
//         }
//     } while (true); // Repite hasta encontrar un código único
// }
//=================================================
//    Registrar pasajeros
//=================================================
exports.registrarPasajero = async (req, res) => {
    try {
        const { nombre,telefono, correo, contrasenna } = req.body;

        // Verificar si el correo ya existe en conductores o pasajeros
               const [existeCorreoConductor, existeCorreoPasajero] = await Promise.all([
                   Conductor.findOne({ correo }),
                   Pasajero.findOne({ correo })
               ]);
       
               if (existeCorreoConductor || existeCorreoPasajero) {
                   return res.status(400).json({
                       ok: false,
                       mensaje: 'El correo ya está en uso'
                   });
               }
        // Verificar si el numero de telefono existe en conductores o pasajeros
               const [existetelefonoConductor, existetelefonoPasajero] = await Promise.all([
                   Conductor.findOne({ telefono }),
                   Pasajero.findOne({ telefono })
               ]);
       
               if (existetelefonoConductor || existetelefonoPasajero) {
                   return res.status(400).json({
                       ok: false,
                       mensaje: 'El numero de telefono ya esta en uso'
                   });
               }

               // Verificar si el teléfono ya existe
                // const existeTelefono = await Pasajero.findOne({ telefono });
                // if (existeTelefono) {
                //     return res.status(400).json({
                //         ok: false,
                //         mensaje: 'El teléfono ya está en uso'
                //     });
                // }

        // Encriptar contraseña
        const saltRounds = 10; // Número de rondas de hashing
        const hashedPassword = await bcrypt.hash(contrasenna, saltRounds);
        //codigoGenerado = await generarCodigoUnico();
        // Crear pasajero
        const nuevoPasajero = new Pasajero({
            nombre,
            telefono,
             codigoUnico: uuidv4(), // Generar código único automáticamente
            //codigoUnico: codigoGenerado, // Generar código único automáticamente
            correo,
            contrasenna: hashedPassword, // Guardar la contraseña cifrada
        });

        // Guardar en la base de datos
        const pasajeroGuardado = await nuevoPasajero.save();

        res.status(201).json({
            ok: true,
            mensaje: 'Pasajero registrado exitosamente',
            pasajero: pasajeroGuardado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al registrar pasajero',
            errors: error.message
        });
    }
};


//====================================================================
//    Obtener perfil del pasajero (solo el propio pasajero o un admin)
//====================================================================
// exports.obtenerPerfilPasajero = async (req, res) => {
//     try {
//         // Obtener el ID del usuario autenticado desde el token
//         const id = req.usuario._id;

//         // Buscar el pasajero por ID
//         const pasajero = await Pasajero.findById(id).select('-contrasenna'); // Excluir la contraseña

//         if (!pasajero) {
//             return res.status(404).json({
//                 ok: false,
//                 mensaje: 'Pasajero no encontrado'
//             });
//         }

//         res.status(200).json({
//             ok: true,
//             pasajero
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             ok: false,
//             mensaje: 'Error al obtener el perfil del pasajero',
//             errors: error.message
//         });
//     }
// };
//====================================================================
//    Obtener perfil del pasajero (solo el propio pasajero o un admin)
//====================================================================
exports.obtenerPerfilPasajero = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token
        const id = req.usuario._id;

        // Buscar el pasajero por ID
        const pasajero = await Pasajero.findById(id).select('-contrasenna'); // Excluir la contraseña

        if (!pasajero) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Pasajero no encontrado'
            });
        }

         // Construir la URL de la imagen
         let imagenUrl;
         if (pasajero.img) {
             // Si hay una imagen, construir la URL completa
             imagenUrl = `http://localhost:3000/img/pasajeros/${pasajero.img}`;
         } else {
             // Si no hay imagen, usar la imagen predeterminada
             imagenUrl = `http://localhost:3000/img/no-img.png`;
         }

        res.status(200).json({
            ok: true,
            pasajero:{
                ...pasajero.toObject(), // Convertir a objeto plano
                img: imagenUrl // Incluir la URL de la imagen
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el perfil del pasajero',
            errors: error.message
        });
    }
};

//====================================================================
//    Actualizar Perfil Pasajero 
//====================================================================
exports.actualizarPerfilPasajero = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token
        const id = req.usuario._id;
        const { nombre, correo, contrasenna } = req.body;

        // Buscar el pasajero por ID
        const pasajero = await Pasajero.findById(id);

        if (!pasajero) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Pasajero no encontrado'
            });
        }

        // Verificar si el correo ya existe en conductores o pasajeros
        const [existeCorreoConductor, existeCorreoPasajero] = await Promise.all([
            Conductor.findOne({ correo }),
            Pasajero.findOne({ correo })
        ]);

        if (existeCorreoConductor || existeCorreoPasajero) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El correo ya está en uso'
            });
        }

        // Actualizar campos
        if (nombre) pasajero.nombre = nombre;
        if (correo) pasajero.correo = correo;
        //if (img) pasajero.img = img;

        // Encriptar nueva contraseña si se proporciona
        if (contrasenna) {
            const saltRounds = 10;
            pasajero.contrasenna = await bcrypt.hash(contrasenna, saltRounds);
        }

        // Guardar cambios
        const pasajeroActualizado = await pasajero.save();

        // Excluir la contraseña en la respuesta
        pasajeroActualizado.contrasenna = undefined;

        res.status(200).json({
            ok: true,
            mensaje: 'Perfil del pasajero actualizado exitosamente',
            pasajero: pasajeroActualizado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar el perfil del pasajero',
            errors: error.message
        });
    }
};


//====================================================================
//    Eliminar Perfil Pasajero
//====================================================================

exports.eliminarPerfilPasajero = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token
        const id = req.usuario._id;

        // Buscar el pasajero por ID
        const pasajero = await Pasajero.findById(id);
        if (!pasajero) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Pasajero no encontrado'
            });
        }

        // Eliminar la imagen asociada si existe
        if (pasajero.img) {
            const pathImagen = path.resolve(`./uploads/pasajeros/${pasajero.img}`);
            if (fs.existsSync(pathImagen)) {
                fs.unlinkSync(pathImagen); // Eliminar el archivo de imagen
            }
        }

        // Eliminar el pasajero de la base de datos
        const pasajeroEliminado = await Pasajero.findByIdAndDelete(id);

        res.status(200).json({
            ok: true,
            mensaje: 'Perfil del pasajero eliminado exitosamente',
            pasajero: pasajeroEliminado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar el perfil del pasajero',
            errors: error.message
        });
    }
};

//====================================================================
//    Valoracion
//====================================================================
exports.dejarValoracion = async (req, res) => {
    try {
        const { conductorId, puntuacion, comentario } = req.body;
        const pasajeroId = req.usuario._id;  // El ID del pasajero está en el token JWT

        // Validar que la puntuación esté en el rango correcto
        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La puntuación debe estar entre 1 y 5'
            });
        }

        // Crear la nueva valoración
        const nuevaValoracion = new Valoracion({
            conductorId,
            pasajeroId,
            puntuacion,
            comentario
        });

        // Guardar la valoración en la base de datos
        await nuevaValoracion.save();

        res.status(201).json({
            ok: true,
            mensaje: 'Valoración guardada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al guardar la valoración',
            errors: error.message
        });
    }
};


exports.logout = (req, res) => {
    res.clearCookie('refreshToken'); // Eliminar la cookie del refresh token
    res.status(200).json({
        ok: true,
        mensaje: 'Sesión cerrada exitosamente'
    });
};