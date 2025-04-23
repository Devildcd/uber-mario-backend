var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolesValidos = {
    values: ['ADMIN_ROLE','SUPERADMIN_ROLE'],
    message:'{VALUE} no es un rol permitido'
}

var usuarioSchema = new Schema({

    nombre : {type: String, required: [true,'El nombre es necesario']},
    correo : {type: String, unique:true, required: [true,'El correo es necesario']},
    telefono:{type:Number,unique: true, required: [true,'El telefono es necesario']},
    contrasenna : {type: String,  required: [true,'La contraseña es necesaria']},
    img : {type: String,  required: false},
    role : {type: String,  required: true,default:'ADMIN_ROLE',enum:rolesValidos},
    

});

usuarioSchema.plugin(uniqueValidator,{message: '{PATH} debe de ser único'})
// Añadir seguridad adicional
// usuarioSchema.methods.toJSON = function() {
//     let obj = this.toObject();
//     delete obj.password;
//     return obj;
// };
module.exports = mongoose.model('Usuario', usuarioSchema);