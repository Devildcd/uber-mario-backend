const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const conductorSchema = new mongoose.Schema({
    nombre: { type: String, required:[true,'El nombre es necesario'] },
    apellido: { type: String, required:[true,'El apellido es necesario'] },
    telefono:{type:Number,unique: true, required: [true,'El telefono es necesario']},
    codigoUnico: { type: String, required: false, unique: true },
    correo: {type: String,unique: true,required: [true,'El correo es necesario'],match: [ /^\S+@\S+\.\S+$/, 'Por favor ingrese un correo valido' ]},
    contrasenna: { type: String, required: [true,'La contraseña es necesaria'] },
    modeloVehiculo: { type: String, required:[true,'El modelo del Vehiculo es necesario'] },
    colorVehiculo: { type: String, required: [true,'El color del Vehiculo es necesario'] },

    // placaVehiculo: {
    //     type: String,
    //     unique: true,
    //     required: [true, 'La placa del Vehiculo es necesaria'],
    //     match: [/^[A-Z0-9-]{5,10}$/, 'Formato de placa inválido'] // Ejemplo: ABC-123
    // },
    placaVehiculo: { type: String,unique: true, required: [true,'La placa del Vehiculo es necesario']},
    capacidadVehiculo: {type: Number,required: true,min: [ 1, 'Capacidad minima 1' ],},
    tipoVehiculo: {
        type: String,
        required: true,
        enum: [ 'carro', 'moto','guagua'],
    },

    // rating: {
    //     promedio: { 
    //         type: Number, 
    //         default: 5.0,
    //         min: [1, 'El rating mínimo es 1'],
    //         max: [5, 'El rating máximo es 5']
    //     },
    //     totalCalificaciones: { 
    //         type: Number, 
    //         default: 0 
    //     }
    // },
    // location: {
    //     type: { type: String, default: 'Point' },
    //     coordinates: { type: [Number], required: true },
    // },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { 
            type: [Number], 
            required: true,
            validate: {
                validator: function(v) {
                    return v.length === 2 && 
                           v[0] >= -180 && v[0] <= 180 &&
                           v[1] >= -90 && v[1] <= 90;
                },
                message: 'Coordenadas inválidas [longitud, latitud]'
            }
        }
    },
    img : {type: String,  required: false},
    estado: {
        type: String,
        enum: [ 'disponible', 'no_disponible','en_viaje' ],
        default: 'no_disponible',
    },

    resetPasswordToken: String, // Nuevo campo
    resetPasswordExpires: Date  // Nuevo campo
    
},

{
    timestamps: true
}
);

// Método para actualizar el rating
// conductorSchema.methods.actualizarRating = function(nuevaCalificacion) {
//     const ratingActual = this.rating.promedio * this.rating.totalCalificaciones;
//     this.rating.totalCalificaciones += 1;
//     this.rating.promedio = (ratingActual + nuevaCalificacion) / this.rating.totalCalificaciones;
// };

// Middleware para invertir coordenadas (Google → MongoDB)
conductorSchema.pre('save', function(next) {
    if (this.isModified('location') || this.isNew) {
        // Invertir las coordenadas para almacenarlas como [longitud, latitud]
        const [lat, lng] = this.location.coordinates;
        this.location.coordinates = [lng, lat]; // Invertimos a [longitud, latitud]
    }
    next();
});
// conductorSchema.pre('save', function(next) {
//     if (this.isModified('location')) {
//         const [lat, lng] = this.location.coordinates;
//         this.location.coordinates = [lng, lat]; // Invierte a [longitud, latitud]
//     }
//     next();
// });

// Índices y plugin
conductorSchema.index({ 
    location: '2dsphere',
    estado: 1,
    tipoVehiculo: 1 
});
conductorSchema.plugin(uniqueValidator, { 
    message: 'El {PATH} ({VALUE}) ya está en uso' 
});

module.exports = mongoose.model('Conductor', conductorSchema);