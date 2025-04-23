const express = require('express');
const  Pasajero  = require('../controllers/pasajeroController');
const { verificaToken,verificaPasajero } = require('../middlewares/autenticacion');

const app = express.Router();

app.post('/registrarPasajero', Pasajero.registrarPasajero);
app.get('/perfilPasajero',verificaToken,verificaPasajero,Pasajero.obtenerPerfilPasajero);
app.put('/actualizarPerfilPasajero',verificaToken,verificaPasajero,Pasajero.actualizarPerfilPasajero);
app.delete('/eliminarPerfilPasajero',verificaToken,verificaPasajero,Pasajero.eliminarPerfilPasajero);
// Ruta para dejar una valoración
app.post('/valoracion',verificaToken,verificaPasajero,Pasajero.dejarValoracion);
// Cerrar sesión (específico para pasajeros)
app.post('/logout', verificaToken, verificaPasajero, Pasajero.logout);

// Renovar token
// app.post('/auth/renovarToken', authController.renovarToken);


module.exports = app;