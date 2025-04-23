const Viaje = require('../models/viaje');  // Tu modelo de Viaje
const Conductor = require('../models/conductor');  // Tu modelo de Conductor
const Pasajero = require('../models/pasajero');  // Tu modelo de Pasajero
const axios = require('axios');


exports.solicitarViaje = async (req, res) => {
    // const { pasajeroId, startLocation, endLocation } = req.body;
    const {  startLocation, endLocation } = req.body;
            const pasajeroId = req.usuario._id;
    try {
        // 1. Calcular la ruta utilizando la API de Google Directions
        const apiKey = process.env.GOOGLE_MAPS_API;

        // Invertir las coordenadas para Google Maps [lat, lng]
        const origen = [startLocation[1], startLocation[0]].join(','); // Convierte [lng, lat] a "lat,lng"
        const destino = [endLocation[1], endLocation[0]].join(',');   // Convierte [lng, lat] a "lat,lng"

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen}&destination=${destino}&key=${apiKey}`;
        const response = await axios.get(url);
        console.log(response.data);

        // 2. Verificar si la API devolvió una ruta válida
        if (response.data.status !== 'OK') {
            return res.status(400).json({ error: 'No se pudo calcular la ruta' });
        }

        const ruta = response.data.routes[0];
        const distanciaMetros = ruta.legs[0].distance.value; // Distancia en metros
        const distanciaKm = distanciaMetros / 1000; // Convertir a kilómetros

        // 3. Calcular el costo del viaje
        const TARIFA_BASE = 5.0; // Tarifa base en dólares
        const COSTO_POR_KM = 1.5; // Costo por kilómetro en dólares

        const costoEstimado = TARIFA_BASE + (distanciaKm * COSTO_POR_KM);

        // 4. Crear el viaje en la base de datos
        const viaje = new Viaje({
            pasajero: pasajeroId,
            startLocation: {
                type: 'Point',
                coordinates: startLocation, // [lng, lat]
            },
            endLocation: {
                type: 'Point',
                coordinates: endLocation,   // [lng, lat]
            },
            ruta,
            distancia: distanciaKm.toFixed(2), // Guardar la distancia en km con 2 decimales
            precio: costoEstimado.toFixed(2), // Guardar el costo estimado con 2 decimales
            estado: 'pendiente', // Estado inicial del viaje
        });

        await viaje.save();

        // 5. Buscar conductores cercanos
        const conductores = await Conductor.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: startLocation, // [lng, lat]
                    },
                    $maxDistance: 5000, // 5 km de radio
                },
            },
            estado: 'disponible', // Solo los conductores disponibles
        });

        // 6. Responder con los detalles del viaje y los conductores cercanos
        res.status(201).json({
            viaje,
            precioEstimado: `$${costoEstimado.toFixed(2)}`, // Enviar costo en formato amigable
            conductoresCercanos: conductores,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// const calcularTarifa = (distanciaKm) => {
//     const tarifaBase = 2; // Tarifa fija inicial en USD
//     const costoPorKm = 0.50; // Costo por km en USD
//     return tarifaBase + (costoPorKm * distanciaKm);
// };

// exports.solicitarViaje = async (req, res) => {
//     const { pasajeroId, inicioUbicacion, finUbicacion } = req.body;

//     try {
//         // 1. Calcular la ruta con la API de Google Maps o OpenStreetMap
//         const apiKey = process.env.GOOGLE_MAPS_API_KEY;
//         const origen = inicioUbicacion.join(',');
//         const destino = finUbicacion.join(',');

//         const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen}&destination=${destino}&key=${apiKey}`;
//         const response = await axios.get(url);

//         if (response.data.status !== 'OK') {
//             return res.status(400).json({ error: 'No se pudo calcular la ruta' });
//         }

//         // 2. Obtener la distancia total en metros
//         const distanciaMetros = response.data.routes[0].legs[0].distance.value;
//         const distanciaKm = distanciaMetros / 1000; // Convertimos metros a km

//         // 3. Calcular la tarifa
//         const tarifa = calcularTarifa(distanciaKm);

//         // 4. Guardar el viaje en la base de datos
//         const viaje = new Viaje({
//             pasajero: pasajeroId,
//             inicioUbicacion: {
//                 type: 'Point',
//                 coordinates: inicioUbicacion,
//             },
//             finUbicacion: {
//                 type: 'Point',
//                 coordinates: finUbicacion,
//             },
//             ruta: response.data.routes[0], // Guardamos la ruta
//             distanciaKm,
//             tarifa, // Guardamos el precio calculado
//             estado: 'pendiente',
//         });

//         await viaje.save();

//         // 5. Buscar conductores cercanos
//         const conductores = await Conductor.find({
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: 'Point',
//                         coordinates: inicioUbicacion,
//                     },
//                     $maxDistance: 5000, // Radio de 5 km
//                 },
//             },
//             estado: 'disponible',
//         });

//         res.status(201).json({
//             viaje,
//             tarifa,
//             conductoresCercanos: conductores,
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


// Aceptar un viaje
exports.aceptarViaje = async (req, res) => {
    const { viajeId } = req.body;
    const conductorId = req.usuario._id; // Tomar el id del conductor autenticado

    try {
        const viaje = await Viaje.findById(viajeId);
        const conductor = await Conductor.findById(conductorId);

        if (!viaje || !conductor) {
            return res.status(404).json({ error: 'Viaje o conductor no encontrado' });
        }

        // Asignar conductor al viaje y marcar el estado del viaje como 'aceptado'
        viaje.conductor = conductorId;
        viaje.estado = 'aceptado';
        conductor.estado = 'en_viaje';

        await viaje.save();
        await conductor.save();

        const viajePopulated = await Viaje.findById(viajeId)
            .populate('pasajero', '-contrasenna')
            .populate('conductor', '-contrasenna');

        res.status(200).json(viajePopulated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// exports.aceptarViaje = async (req, res) => {
//     const { viajeId, conductorId } = req.body;

//     try {
//         const viaje = await Viaje.findById(viajeId);
//         const conductor = await Conductor.findById(conductorId);

//         if (!viaje || !conductor) {
//             return res.status(404).json({ error: 'Viaje o conductor no encontrado' });
//         }

//         // Asignar conductor al viaje y marcar el estado del viaje como 'aceptado'
//         viaje.conductor = conductorId;
//         viaje.estado = 'aceptado';
//         conductor.estado = 'en_viaje'; // Cambiar el estado del conductor

//         await viaje.save();
//         await conductor.save();

//          // Obtener el viaje con los datos completos del pasajero y conductor
//          const viajePopulated = await Viaje.findById(viajeId)
//          .populate('pasajero','nombre telefono')
//          .populate('conductor','nombre telefono estado');

//         res.status(200).json(viajePopulated);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

exports.buscarConductoresCercanos = async (req, res) => {
    const { pasajeroId, ubicacion } = req.body; // Ahora recibimos las coordenadas directamente

    try {
        // Buscar al pasajero en la base de datos
        const pasajero = await Pasajero.findById(pasajeroId);
        if (!pasajero) {
            return res.status(404).json({ error: 'Pasajero no encontrado' });
        }

        // Verificar si se pasaron coordenadas en la solicitud
        const inicioUbicacion = ubicacion || pasajero.ubicacion.coordinates; 
        if (!inicioUbicacion) {
            return res.status(400).json({ error: 'Ubicación no disponible' });
        }

        // Invertir las coordenadas recibidas para que estén en el formato [latitud, longitud]
        const [latitud, longitud] = inicioUbicacion;
        const ubicacionCorrecta = [longitud, latitud];  // Invertimos a [longitud, latitud]

        // Buscar conductores cercanos en un radio de 5 km
        const conductores = await Conductor.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: ubicacionCorrecta, // Usamos las coordenadas invertidas
                    },
                    $maxDistance: 5000, // 5 km de radio
                },
            },
            estado: 'disponible', // Solo los conductores disponibles
        });

        // Responder con la lista de conductores cercanos
        res.status(200).json({ conductores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Endpoint para obtener los conductores
// Endpoint para obtener los conductores
exports.obtenerConductores = async (req, res) => {
    try {
        // Buscar todos los conductores disponibles
        const conductores = await Conductor.find({ estado: 'disponible' });

        // Invertir las coordenadas antes de enviarlas al cliente
        const conductoresConCoordenadasInvertidas = conductores.map(conductor => {
            const { location } = conductor; // Ubicación del conductor
            if (location && location.coordinates) {
                const [lat, lng] = location.coordinates; // Coordenadas en formato MongoDB [lat, lng]
                conductor.location.coordinates = [lng, lat]; // Invertir las coordenadas para Google Maps [lng, lat]
            }
            return conductor;
        });
        // recomendado probar despues 
        // const conductoresConCoordenadasInvertidas = conductores.map(conductorDoc => {
        //     const conductor = conductorDoc.toObject();
        //     if (conductor.location && conductor.location.coordinates) {
        //       const [lat, lng] = conductor.location.coordinates;
        //       conductor.location.coordinates = [lng, lat];
        //     }
        //     return conductor;
        //   });
          

        // Responder con los conductores encontrados y las coordenadas invertidas
        res.status(200).json({ conductores: conductoresConCoordenadasInvertidas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.iniciarViaje = async (req, res) => {
    const { viajeId } = req.body;
    const conductorId = req.usuario._id; // ID del conductor autenticado

    try {
        const viaje = await Viaje.findById(viajeId);
        const conductor = await Conductor.findById(conductorId);

        if (!viaje || !conductor) {
            return res.status(404).json({ error: 'Viaje o conductor no encontrado' });
        }

        // Verificar si el conductor es el asignado al viaje
        if (viaje.conductor.toString() !== conductorId.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para iniciar este viaje' });
        }

        // Iniciar el viaje
        viaje.estado = 'en_progreso';
        conductor.estado = 'en_viaje'; // Cambiar el estado del conductor

        await viaje.save();
        await conductor.save();
        const viajePopulated = await Viaje.findById(viajeId)
        .populate('pasajero', 'nombre')
        .populate('conductor', 'nombre');

        res.status(200).json(viajePopulated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.finalizarViaje = async (req, res) => {
    const { viajeId } = req.body;
    const conductorId = req.usuario._id; // ID del conductor autenticado

    try {
        const viaje = await Viaje.findById(viajeId);
        const conductor = await Conductor.findById(conductorId);

        if (!viaje || !conductor) {
            return res.status(404).json({ error: 'Viaje o conductor no encontrado' });
        }

        // Verificar si el conductor es el asignado al viaje
        if (viaje.conductor.toString() !== conductorId.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para finalizar este viaje' });
        }

        // Finalizar el viaje
        viaje.estado = 'completado';
        conductor.estado = 'disponible'; // Cambiar el estado del conductor a disponible

        await viaje.save();
        await conductor.save();

        res.status(200).json(viaje);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.cancelarViaje = async (req, res) => {
    const { viajeId } = req.body;
    const usuarioId = req.usuario._id; // ID del usuario autenticado (puede ser pasajero o conductor)

    try {
        const viaje = await Viaje.findById(viajeId);
        if (!viaje) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // Verificar si el usuario es el pasajero o el conductor asignado al viaje
        if (viaje.pasajero.toString() !== usuarioId.toString() && viaje.conductor.toString() !== usuarioId.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para cancelar este viaje' });
        }

        // Cambiar el estado del viaje a "cancelado"
        viaje.estado = 'cancelado';
        await viaje.save();

        // Si hay un conductor asignado, cambiar su estado a "disponible"
        if (viaje.conductor) {
            const conductor = await Conductor.findById(viaje.conductor);
            if (conductor) {
                conductor.estado = 'disponible';
                await conductor.save();
            }
        }

        res.status(200).json(viaje);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.obtenerDetallesViaje = async (req, res) => {
    const { viajeId } = req.params;

    try {
        const viaje = await Viaje.findById(viajeId).populate('pasajero conductor');
        if (!viaje) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        res.status(200).json(viaje);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.obtenerHistorialViajesPasajero = async (req, res) => {
    const pasajeroId = req.usuario._id; // ID del pasajero autenticado

    try {
        const historial = await Viaje.find({ pasajero: pasajeroId }).populate('conductor');
        if (!historial || historial.length === 0) {
            return res.status(404).json({ error: 'No se encontraron viajes para este pasajero' });
        }

        res.status(200).json(historial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.calcularTarifa = async (req, res) => {
    const { startLocation, endLocation } = req.body;

    try {
        // Calcular la ruta utilizando la API de Google Directions
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const origen = startLocation.join(',');
        const destino = endLocation.join(',');

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen}&destination=${destino}&key=${apiKey}`;
        const response = await axios.get(url);

        if (response.data.status !== 'OK') {
            return res.status(400).json({ error: 'No se pudo calcular la ruta' });
        }

        const ruta = response.data.routes[0];
        const distanciaMetros = ruta.legs[0].distance.value;
        const distanciaKm = distanciaMetros / 1000;

        // Calcular el costo del viaje
        const TARIFA_BASE = 5.0; // Tarifa base en dólares
        const COSTO_POR_KM = 1.5; // Costo por kilómetro en dólares

        const costoEstimado = TARIFA_BASE + (distanciaKm * COSTO_POR_KM);

        res.status(200).json({
            distancia: distanciaKm.toFixed(2),
            precioEstimado: `$${costoEstimado.toFixed(2)}`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// exports.buscarConductoresCercanos = async (req, res) => {
//     const { pasajeroId, ubicacion } = req.body; // Ahora recibimos las coordenadas directamente

//     try {
//         // Buscar al pasajero en la base de datos
//         const pasajero = await Pasajero.findById(pasajeroId);
//         if (!pasajero) {
//             return res.status(404).json({ error: 'Pasajero no encontrado' });
//         }

//         // Verificar si se pasaron coordenadas en la solicitud
//         const inicioUbicacion = ubicacion || pasajero.ubicacion.coordinates; 
//         if (!inicioUbicacion) {
//             return res.status(400).json({ error: 'Ubicación no disponible' });
//         }

//         // Buscar conductores cercanos en un radio de 5 km
//         const conductores = await Conductor.find({
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: 'Point',
//                         coordinates: inicioUbicacion,
//                     },
//                     $maxDistance: 5000, // 5 km de radio
//                 },
//             },
//             estado: 'disponible', // Solo los conductores disponibles
//         });

//         // Responder con la lista de conductores cercanos
//         res.status(200).json({ conductores });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };
// exports.buscarConductoresCercanos = async (req, res) => {
//     const { pasajeroId } = req.body;

//     try {
//         // Buscar al pasajero en la base de datos
//         const pasajero = await Pasajero.findById(pasajeroId);
//         if (!pasajero) {
//             return res.status(404).json({ error: 'Pasajero no encontrado' });
//         }

//         // Extraer ubicación del pasajero
//         const inicioUbicacion = pasajero.ubicacion; // Asegúrate de que el modelo de pasajero tenga este campo
//         if (!inicioUbicacion || !inicioUbicacion.coordinates) {
//             return res.status(400).json({ error: 'Ubicación del pasajero no disponible' });
//         }

//         // Buscar conductores cercanos en un radio de 5 km
//         const conductores = await Conductor.find({
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: 'Point',
//                         coordinates: inicioUbicacion.coordinates,
//                     },
//                     $maxDistance: 5000, // 5 km de radio
//                 },
//             },
//             estado: 'disponible', // Solo los conductores disponibles
//         });

//         // Responder con la lista de conductores cercanos
//         res.status(200).json({ conductores });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// const Viaje = require('../models/viaje');
// const Conductor = require('../models/conductor');
// const Pasajero = require('../models/pasajero');
// const axios = require('axios');

// exports.requestRide = async (req, res) => {
//     const { pasajeroId, startLocation, endLocation } = req.body;

//     try {
//         // 1. Calcular la ruta usando Google Directions API
//         const apiKey = process.env.GOOGLE_MAPS_API_KEY;
//         const origin = startLocation.join(','); // Convierte [lat, lng] a "lat,lng"
//         const destination = endLocation.join(','); // Convierte [lat, lng] a "lat,lng"

//         const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
//         const response = await axios.get(url);

//         // 2. Verificar si la API devolvió una ruta válida
//         if (response.data.status !== 'OK') {
//             return res.status(400).json({ error: 'No se pudo calcular la ruta' });
//         }

//         // 3. Crear el viaje en la base de datos
//         const viaje = new Viaje({
//             pasajero: pasajeroId,
//             startLocation: {
//                 type: 'Point',
//                 coordinates: startLocation,
//             },
//             endLocation: {
//                 type: 'Point',
//                 coordinates: endLocation,
//             },
//             route: response.data.routes[0], // Guardar la ruta calculada
//             estado: 'pendiente', // Estado inicial del viaje
//         });

//         await viaje.save();

//         // 4. Buscar conductores cercanos
//         const conductores = await Conductor.find({
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: 'Point',
//                         coordinates: startLocation,
//                     },
//                     $maxDistance: 5000, // 5 km de radio
//                 },
//             },
//             estado: 'disponible', // Solo conductores disponibles
//         });

//         // 5. Responder con los detalles del viaje y los conductores cercanos
//         res.status(201).json({
//             viaje,
//             conductoresCercanos: conductores,
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// exports.acceptRide = async (req, res) => {
//     const { viajeId, conductorId } = req.body;

//     try {
//         const viaje = await Viaje.findById(viajeId);
//         const conductor = await Conductor.findById(conductorId);

//         if (!viaje || !conductor) {
//             return res.status(404).json({ error: 'Viaje o conductor no encontrado' });
//         }

//         // Actualizar el viaje con el conductor
//         viaje.conductor = conductorId;
//         viaje.estado = 'aceptado';
//         conductor.estado = 'en_viaje'; // El conductor ya no está disponible

//         // Guardar el viaje y el conductor
//         await viaje.save();
//         await conductor.save();

//         res.json(viaje);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };


