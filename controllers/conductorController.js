const Conductor = require('../models/conductor');
const Pasajero = require('../models/pasajero'); // Importar el modelo de Pasajero
const Viaje = require('../models/viaje'); // Importar el modelo de Pasajero
const Valoracion = require('../models/valoracion'); // Importar el modelo de Pasajero
var bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Importar uuid



//=================================================
//    Registrar conductor
//=================================================
exports.registrarConductor = async (req, res) => {
    try {
        //console.log("Datos recibidos en el body:", req.body);
        const { nombre, apellido,telefono, correo, contrasenna, modeloVehiculo, colorVehiculo, placaVehiculo, capacidadVehiculo, tipoVehiculo, location, estado } = req.body;

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

      

        // Verificar si la placa ya existe en conductores
        const existePlaca = await Conductor.findOne({ placaVehiculo });
        if (existePlaca) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La placa ya está registrada'
            });
        }



        // Encriptar contraseña
        const saltRounds = 10; // Número de rondas de hashing
        const hashedPassword = await bcrypt.hash(contrasenna, saltRounds);

       
       
        // Crear nuevo conductor
        const nuevoConductor = new Conductor({
            nombre,
            apellido,
            telefono,
            // codigoUnico: uuidv4(),
            codigoUnico: uuidv4(),
            correo,
            contrasenna: hashedPassword,
            modeloVehiculo,
            colorVehiculo,
            placaVehiculo,
            capacidadVehiculo,
            tipoVehiculo,
            location: {
                type: 'Point',
                coordinates: location,
            },
            estado
        });

        // Guardar conductor en la base de datos
        const conductorGuardado = await nuevoConductor.save();

        res.status(201).json({
            ok: true,
            mensaje: 'Conductor guardado exitosamente',
            conductor: conductorGuardado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al registrar conductor',
            errors: error.message
        });
    }
};


//====================================================================
//    Obtener perfil del Conductor 
//====================================================================
// exports.obtenerPerfilConductor = async (req, res) => {
//     try {
//         // Obtener el ID del usuario autenticado desde el token
//         const id = req.usuario._id;

//         // Buscar el conductor por ID
//         const conductor = await Conductor.findById(id).select('-contrasenna'); // Excluir la contraseña

//         if (!conductor) {
//             return res.status(404).json({
//                 ok: false,
//                 mensaje: 'Conductor no encontrado'
//             });
//         }

//         res.status(200).json({
//             ok: true,
//             conductor
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             ok: false,
//             mensaje: 'Error al obtener el perfil del conductor',
//             errors: error.message
//         });
//     }
// };
exports.obtenerPerfilConductor = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token
        const id = req.usuario._id;

        // Buscar el conductor por ID
        const conductor = await Conductor.findById(id).select('-contrasenna'); // Excluir la contraseña

        if (!conductor) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Conductor no encontrado'
            });
        }

        // Construir la URL de la imagen
        let imagenUrl;
        if (conductor.img) {
            // Si hay una imagen, construir la URL completa
            imagenUrl = `http://localhost:3000/img/conductores/${conductor.img}`;
        } else {
            // Si no hay imagen, usar la imagen predeterminada
            imagenUrl = `http://localhost:3000/img/no-img.png`;
        }

        // Devolver el perfil del conductor con la URL de la imagen
        res.status(200).json({
            ok: true,
            conductor: {
                ...conductor.toObject(), // Convertir a objeto plano
                img: imagenUrl // Incluir la URL de la imagen
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el perfil del conductor',
            errors: error.message
        });
    }
};

//====================================================================
//    Actualizar perfil del Conductor 
//====================================================================
exports.actualizarPerfilConductor = async (req, res) => {
    try {
        const id = req.usuario._id; // ID del conductor autenticado
        const { nombre, apellido, correo, modeloVehiculo, colorVehiculo, placaVehiculo, capacidadVehiculo, tipoVehiculo, location,  estado } = req.body;

        
        // Verificar si el conductor existe
        const conductor = await Conductor.findById(id);
        if (!conductor) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Conductor no encontrado'
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

        // Verificar si la placa ya existe en conductores
        const existePlaca = await Conductor.findOne({ placaVehiculo });
        if (existePlaca) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La placa ya está registrada'
            });
        }

       

        // Actualizar los campos permitidos
        conductor.nombre = nombre || conductor.nombre;
        conductor.apellido = apellido || conductor.apellido;
        conductor.correo = correo || conductor.correo;
        conductor.modeloVehiculo = modeloVehiculo || conductor.modeloVehiculo;
        conductor.colorVehiculo = colorVehiculo || conductor.colorVehiculo;
        conductor.placaVehiculo = placaVehiculo || conductor.placaVehiculo;
        conductor.capacidadVehiculo = capacidadVehiculo || conductor.capacidadVehiculo;
        conductor.tipoVehiculo = tipoVehiculo || conductor.tipoVehiculo;
        conductor.location = location || conductor.location;
        //conductor.img = img || conductor.img;
        conductor.estado = estado || conductor.estado;

        // Guardar los cambios
        const conductorActualizado = await conductor.save();

        res.status(200).json({
            ok: true,
            mensaje: 'Perfil del conductor actualizado exitosamente',
            conductor: conductorActualizado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar el perfil del conductor',
            errors: error.message
        });
    }
};

//====================================================================
//    Eliminar perfil del Conductor 
//====================================================================
exports.eliminarPerfilConductor = async (req, res) => {
    try {
        const id = req.usuario._id; // ID del conductor autenticado

        // Verificar si el conductor existe
        const conductor = await Conductor.findById(id);
        if (!conductor) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Conductor no encontrado'
            });
        }

        // Eliminar la imagen asociada si existe
        if (conductor.img) {
            const pathImagen = path.resolve(`./uploads/conductores/${conductor.img}`);
            if (fs.existsSync(pathImagen)) {
                fs.unlinkSync(pathImagen); // Eliminar el archivo de imagen
            }
        }

        // Eliminar el conductor de la base de datos
     const conductorEliminado =   await Conductor.findByIdAndDelete(id);

        res.status(200).json({
            ok: true,
            mensaje: 'Perfil del conductor eliminado exitosamente',
            conductor: conductorEliminado

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar el perfil del conductor',
            errors: error.message
        });
    }
};

//====================================================================
//    Cambiar Contraseña
//====================================================================

exports.cambiarContrasenna = async (req, res) => {
    try {
        const id = req.usuario._id;
        const { antiguaContrasenna, nuevaContrasenna } = req.body;

        const conductor = await Conductor.findById(id);
        if (!conductor) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Conductor no encontrado'
            });
        }

        // Verificar si la contraseña antigua es correcta
        const contrasennaValida = await bcrypt.compare(antiguaContrasenna, conductor.contrasenna);
        if (!contrasennaValida) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Contraseña antigua incorrecta'
            });
        }

        // Encriptar la nueva contraseña
        const saltRounds = 10;
        const nuevaContrasennaHash = await bcrypt.hash(nuevaContrasenna, saltRounds);

        // Actualizar la contraseña
        conductor.contrasenna = nuevaContrasennaHash;

        // Guardar cambios
        await conductor.save();

        res.status(200).json({
            ok: true,
            mensaje: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al cambiar la contraseña',
            errors: error.message
        });
    }
};


//====================================================================
//    Actualizar estado de disponibilidad
//====================================================================
const ESTADOS_CONDUCTOR = {
    DISPONIBLE: 'disponible',
    NO_DISPONIBLE: 'no_disponible',
    EN_VIAJE: 'en_viaje'
};

exports.actualizarDisponibilidad = async (req, res) => {
    try {
        const id = req.usuario._id;
        const { disponible } = req.body;

        // Validar que disponible es un valor booleano
        if (typeof disponible !== 'boolean') {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo "disponible" debe ser un valor booleano (true/false)'
            });
        }

        const conductor = await Conductor.findById(id);
        if (!conductor) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Conductor no encontrado'
            });
        }

        // Actualizar estado
        conductor.estado = disponible ? ESTADOS_CONDUCTOR.DISPONIBLE : ESTADOS_CONDUCTOR.NO_DISPONIBLE;
        await conductor.save();

        res.status(200).json({
            ok: true,
            mensaje: `El conductor ${conductor.nombre} ha sido actualizado a ${disponible ? 'Disponible' : 'No disponible'}`,
            conductor
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar disponibilidad',
            errors: error.message
        });
    }
};


//====================================================================
//    Obtener Historial de Viaje 
//====================================================================
exports.obtenerHistorialViajes = async (req, res) => {
    try {
        const id = req.usuario._id;

        // Asumiendo que tienes un modelo de Viaje que registra los viajes
        const historial = await Viaje.find({ conductor: id }).populate('pasajero');

        if (!historial || historial.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'No se encontraron viajes para este conductor'
            });
        }

        res.status(200).json({
            ok: true,
            historial
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el historial de viajes',
            errors: error.message
        });
    }
};


//====================================================================
//    Obtener puntuacion del conductor
//====================================================================
exports.obtenerPuntuacionConductor = async (req, res) => {
    try {
        const id = req.usuario._id;

        // Asumiendo que tienes un modelo de Valoracion o Review
        const valoraciones = await Valoracion.find({ conductorId: id });

        if (!valoraciones || valoraciones.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'No hay valoraciones para este conductor'
            });
        }

        // Calcular la puntuación promedio
        const puntuacionPromedio = valoraciones.reduce((acc, valoracion) => acc + valoracion.puntuacion, 0) / valoraciones.length;

        res.status(200).json({
            ok: true,
            puntuacionPromedio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la puntuación del conductor',
            errors: error.message
        });
    }
};

//====================================================================
//    Calificar Pasajero
//====================================================================
exports.calificarPasajero = async (req, res) => {
    try {
        const { viajeId, puntuacion, comentario } = req.body;
        const conductorId = req.usuario._id;

        const viaje = await Viaje.findById(viajeId);
        if (!viaje) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Viaje no encontrado'
            });
        }

        // Verificar si el conductor es el asignado al viaje
        if (viaje.conductor.toString() !== conductorId.toString()) {
            return res.status(403).json({
                ok: false,
                mensaje: 'No tienes permiso para calificar este viaje'
            });
        }

        // Crear la valoración
        const nuevaValoracion = new Valoracion({
            viaje: viajeId,
            conductor: conductorId,
            pasajero: viaje.pasajero,
            puntuacion,
            comentario
        });

        await nuevaValoracion.save();

        res.status(201).json({
            ok: true,
            mensaje: 'Pasajero calificado exitosamente',
            valoracion: nuevaValoracion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al calificar al pasajero',
            errors: error.message
        });
    }
};

//====================================================================
//    Obtener Detalles del Viaje Específico
//====================================================================
exports.obtenerDetallesViaje = async (req, res) => {
    try {
        const { viajeId } = req.params;
        const conductorId = req.usuario._id;

        const viaje = await Viaje.findById(viajeId).populate('pasajero');
        if (!viaje) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Viaje no encontrado'
            });
        }

        // Verificar si el conductor es el asignado al viaje
        if (viaje.conductor.toString() !== conductorId.toString()) {
            return res.status(403).json({
                ok: false,
                mensaje: 'No tienes permiso para ver este viaje'
            });
        }

        res.status(200).json({
            ok: true,
            viaje
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los detalles del viaje',
            errors: error.message
        });
    }
};