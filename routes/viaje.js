const express = require('express');
const { solicitarViaje, aceptarViaje,buscarConductoresCercanos,obtenerConductores,iniciarViaje } = require('../controllers/viajeController');
const { verificaToken,verificaConductor,verificaPasajero } = require('../middlewares/autenticacion');

const app = express.Router();

app.post('/solicitarViaje',verificaToken,verificaPasajero,solicitarViaje);
app.post('/aceptarViaje',verificaToken, verificaConductor, aceptarViaje);
app.post('/buscarConductores', buscarConductoresCercanos);
app.get('/obtenerConductores', obtenerConductores);
app.post('/iniciarViaje',verificaToken, verificaConductor, iniciarViaje);

// router.post('/finalizar-viaje', viajeController.finalizarViaje);
// router.post('/cancelar-viaje', viajeController.cancelarViaje);
// router.get('/viaje/:viajeId', viajeController.obtenerDetallesViaje);
// router.get('/historial-pasajero', viajeController.obtenerHistorialViajesPasajero);
// router.post('/calcular-tarifa', viajeController.calcularTarifa);

module.exports = app;