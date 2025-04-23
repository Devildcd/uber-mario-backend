const express = require('express');
const conductorController = require('../controllers/conductorController');
const { verificaToken,verificaConductor } = require('../middlewares/autenticacion');


const app = express.Router();

app.post('/registrarConductor',conductorController.registrarConductor);
app.get('/obtenerPerfilConductor',verificaToken,verificaConductor,conductorController.obtenerPerfilConductor);
app.put('/actualizarPerfilConductor', verificaToken, verificaConductor, conductorController.actualizarPerfilConductor);
app.delete('/eliminarPerfilConductor', verificaToken, verificaConductor, conductorController.eliminarPerfilConductor);
// app.get('/nearby', conductorController.findNearbyDrivers);

module.exports = app;