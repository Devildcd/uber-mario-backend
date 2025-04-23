const express = require('express');
const loginController = require('../controllers/loginController');

const app = express.Router();

app.post('/iniciarSession',loginController.login);
app.post('/cerrarSession',loginController.logout);
// Renovar token
app.post('/renovarToken', loginController.renovarToken);
// app.get('/nearby', conductorController.findNearbyDrivers);




module.exports = app;








