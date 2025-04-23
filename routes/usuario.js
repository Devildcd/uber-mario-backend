// Requires
var express = require('express');
var app = express.Router();

var usuarioController = require('../controllers/usuarioController');
var mdAutenticacion = require('../middlewares/autenticacion');

// Rutas para obtener, crear, actualizar y eliminar usuarios
app.get("/obtenerUsuario", mdAutenticacion.verificaToken,mdAutenticacion.verificaAdmin, usuarioController.obtenerUsuarios);
// Rutas para obtener conductores
app.get("/obtenerViajes", mdAutenticacion.verificaToken, mdAutenticacion.verificaAdmin, usuarioController.obtenerViajes);
// Rutas para obtener conductores
app.get("/obtenerConductores", mdAutenticacion.verificaToken, mdAutenticacion.verificaAdmin, usuarioController.obtenerConductores);
// Rutas para obtener pasajeros
app.get("/obtenerPasajeros", mdAutenticacion.verificaToken, mdAutenticacion.verificaAdmin, usuarioController.obtenerPasajeros);
app.post("/crearUsuario", usuarioController.crearUsuario);
app.put("/actualizarUsuario/:id", mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminOMismoUsuario, usuarioController.actualizarUsuario);
app.delete("/eliminarUsuario/:id", mdAutenticacion.verificaToken,mdAutenticacion.verificaAdmin, usuarioController.eliminarUsuario);



module.exports = app;