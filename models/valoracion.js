const mongoose = require('mongoose');
const { Schema } = mongoose;

const valoracionSchema = new Schema({
    conductorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conductor', // Referencia al modelo Conductor
        required: true
    },
    pasajeroId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pasajero', // Referencia al modelo Pasajero (si tienes este modelo)
        required: true
    },
    puntuacion: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comentario: {
        type: String,
        required: false // El comentario puede ser opcional
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Valoracion', valoracionSchema);
