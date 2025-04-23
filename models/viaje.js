const mongoose = require('mongoose');

const viajeSchema = new mongoose.Schema({
    // pasajero: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Pasajero',
    //     required: true,
    //     validate: {
    //         validator: async v => await mongoose.model('Pasajero').exists({ _id: v }),
    //         message: 'El pasajero no existe'
    //     }
    // },
    pasajero: { type: mongoose.Schema.Types.ObjectId, ref: 'Pasajero', required: true },
    conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'Conductor' },
    // startLocation: {
    //     type: { type: String, default: 'Point' },
    //     coordinates: { type: [Number], required: true },
    // },
    // endLocation: {
    //     type: { type: String, default: 'Point' },
    //     coordinates: { type: [Number], required: true },
    // },
    startLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { 
            type: [Number], 
            required: true,
            validate: {
                validator: v => v.length === 2,
                message: 'Las coordenadas deben ser [longitud, latitud]'
            }
        }
    },
    endLocation: {
        type: { type: String, default: 'Point' },
        coordinates: { 
            type: [Number], 
            required: true,
            validate: {
                validator: v => v.length === 2,
                message: 'Las coordenadas deben ser [longitud, latitud]'
            }
        }
    },
    estado: { type: String, enum: ['pendiente', 'aceptado', 'completado','cancelado','en_progreso'], default: 'pendiente' },
    precio: { type: Number, min: [0, 'El precio no puede ser negativo']},
    distancia: {type: Number,min: [0, 'La distancia no puede ser negativa']},
    fechaFinalizacion: {
        type: Date,
        validate: {
            validator: function(v) {
                return ['completado', 'cancelado'].includes(this.estado) ? !!v : true;
            },
            message: 'La fecha de finalización es requerida para viajes completados/cancelados'
        }
    }
}, {
    timestamps: true
});
viajeSchema.pre('save', function(next) {
    // Convertir coordenadas de Google Maps a MongoDB
    if (this.isModified('startLocation')) {
        const [lat, lng] = this.startLocation.coordinates;
        this.startLocation.coordinates = [lng, lat];
    }
    
    if (this.isModified('endLocation')) {
        const [lat, lng] = this.endLocation.coordinates;
        this.endLocation.coordinates = [lng, lat];
    }
    
    next();
});

viajeSchema.index({ startLocation: '2dsphere' });
viajeSchema.index({ endLocation: '2dsphere' });

module.exports = mongoose.model('Viaje', viajeSchema);