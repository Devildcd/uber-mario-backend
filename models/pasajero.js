const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator'); 

const pasajeroSchema = new mongoose.Schema({
    nombre: { type: String, required:  [true,'El nombre es necesario'] },
    telefono:{type:Number,unique: true, required: [true,'El telefono es necesario']},
    codigoUnico: { type: String, required: false, unique: true },
   // apellido: { type: String, required: true },
    correo: {type: String,unique: true,required: [true,'El correo es necesario'],match: [ /^\S+@\S+\.\S+$/, 'Por favor ingrese un correo valido' ]},
    contrasenna: { type: String, required: [true,'La contraseña es necesaria']},
    img : {type: String,  required: false},
    resetPasswordToken: String, // Nuevo campo
    resetPasswordExpires: Date  // Nuevo campo
},{ timestamps: true });

pasajeroSchema.plugin(uniqueValidator, { message: 'El {PATH} ya está registrado' });

module.exports = mongoose.model('Pasajero', pasajeroSchema);