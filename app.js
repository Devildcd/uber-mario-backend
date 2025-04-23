// Requires
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser'); // Importar cookie-parser
require('dotenv').config();

// Inicializar app
const app = express();

// 1. Configuración de Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser()); // Configurar cookie-parser

// 2. Configuración de rutas estáticas (para imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Importar rutas
const usuarioRoutes = require('./routes/usuario');
const conductorRoutes = require('./routes/conductor');
const pasajeroRoutes = require('./routes/pasajero');
const viajeRoutes = require('./routes/viaje');
const uploadRoutes = require('./routes/upload'); // Agregado
const imagenesRoutes = require('./routes/imagenes'); // Agregado
const loginRoutes = require('./routes/login');
const recuperarContrasennaRouters = require('./routes/recuperacion');

//Conexion con la Base de Datos
mongoose.connect(process.env.URL_SERVER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true,
  // useFindAndModify: false
});
// mongoose.connect(process.env.DB_URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Conexión a MongoDB establecida \x1b[32m%s\x1b[0m'))
// .catch(err => console.error('Error al conectar a MongoDB:', err));

// Manejo de eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('Base de Datos \x1b[32m%s\x1b[0m', 'online');
  });
  
  mongoose.connection.on('error', (err) => {
    console.log(`Error en la conexión a la base de datos: ${err}`);
  });



//Rutas registradas
app.use('/api/usuario',usuarioRoutes);
app.use('/api/conductor',conductorRoutes);
app.use('/api/pasajero',pasajeroRoutes);
app.use('/api/viaje',viajeRoutes);
app.use('/upload',uploadRoutes);
app.use('/img', imagenesRoutes);
app.use('/api/login',loginRoutes);
app.use('/api/recuperarContrasenna',recuperarContrasennaRouters);




// Escuchar peticiones
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Express server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});