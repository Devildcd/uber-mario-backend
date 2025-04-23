// Requires
var express = require('express');
//Encriptar contraseña
var bcrypt = require('bcryptjs');

//JWT
var jwt = require('jsonwebtoken');
//Verifica token
var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();
//Importar modelo usuario
var Usuario = require('../models/usuario');
var Viaje = require('../models/viaje');
var Conductor = require('../models/conductor');
var Pasajero = require('../models/pasajero');



//=================================================
// Obtener todos los usuarios
//=================================================
exports.obtenerUsuarios = (req, res, next) => {
  var desde = req.query.desde || 0;
  desde = Number(desde);

  // Filtramos por el tipo de usuario (solo ADMIN o SUPERADMIN pueden ver todos los usuarios)
  // if (req.usuario.role !== 'ADMIN_ROLE' && req.usuario.role !== 'SUPERADMIN_ROLE') {
  //   return res.status(403).json({
  //     ok: false,
  //     mensaje: 'Acceso denegado: Se requiere rol de administrador',
  //   });
  // }

  Usuario.find({}, 'nombre email img role')
    .skip(desde)
    .limit(6)
    .exec()
    .then((usuarios) => {
      return Usuario.countDocuments({}).then((conteo) => {
        res.status(200).json({
          ok: true,
          usuarios: usuarios,
          total: conteo,
        });
      });
    })
    .catch((err) => {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error cargando usuarios',
        errors: err,
      });
    });
};

//=================================================
// Obtener todos los viajes (solo para admins)
//=================================================
exports.obtenerViajes = (req, res) => {
  // if (req.usuario.role !== 'ADMIN_ROLE' && req.usuario.role !== 'SUPERADMIN_ROLE') {
  //   return res.status(403).json({
  //     ok: false,
  //     mensaje: 'Acceso denegado: Se requiere rol de administrador',
  //   });
  // }

  Viaje.find()
    .populate('conductor pasajero') // Añadir detalles de conductor y pasajero
    .exec()
    .then((viajes) => {
      res.status(200).json({
        ok: true,
        viajes: viajes,
      });
    })
    .catch((err) => {
      res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener viajes',
        errors: err,
      });
    });
};

//=================================================
// Obtener todos los conductores (solo admins)
//=================================================
exports.obtenerConductores = (req, res) => {
  // if (req.usuario.role !== 'ADMIN_ROLE' && req.usuario.role !== 'SUPERADMIN_ROLE') {
  //   return res.status(403).json({
  //     ok: false,
  //     mensaje: 'Acceso denegado: Se requiere rol de administrador',
  //   });
  // }

  Conductor.find()
    .exec()
    .then((conductores) => {
      res.status(200).json({
        ok: true,
        conductores: conductores,
      });
    })
    .catch((err) => {
      res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener conductores',
        errors: err,
      });
    });
};

//=================================================
// Obtener todos los pasajeros (solo admins)
//=================================================
exports.obtenerPasajeros = (req, res) => {
  // if (req.usuario.role !== 'ADMIN_ROLE' && req.usuario.role !== 'SUPERADMIN_ROLE') {
  //   return res.status(403).json({
  //     ok: false,
  //     mensaje: 'Acceso denegado: Se requiere rol de administrador',
  //   });
  // }

  Pasajero.find()
    .exec()
    .then((pasajeros) => {
      res.status(200).json({
        ok: true,
        pasajeros: pasajeros,
      });
    })
    .catch((err) => {
      res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener pasajeros',
        errors: err,
      });
    });
};

//=================================================
// Crear un nuevo usuario
//=================================================
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, telefono, contrasenna, img, role } = req.body;

    if (!correo || !telefono || !contrasenna) {
      return res.status(400).json({
        ok: false,
        mensaje: "Correo, teléfono y contraseña son obligatorios",
      });
    }

    // Verificar si el correo ya existe
    const [existeCorreoUsuario, existeCorreoConductor, existeCorreoPasajero] = await Promise.all([
      Usuario.findOne({ correo }),
      Conductor.findOne({ correo }),
      Pasajero.findOne({ correo })
    ]);

    if (existeCorreoUsuario || existeCorreoConductor || existeCorreoPasajero) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo ya está en uso",
      });
    }

    // Verificar si el teléfono ya existe
    const [existetelefonoUsuario, existetelefonoConductor, existetelefonoPasajero] = await Promise.all([
      Usuario.findOne({ telefono }),
      Conductor.findOne({ telefono }),
      Pasajero.findOne({ telefono })
    ]);

    if (existetelefonoUsuario || existetelefonoConductor || existetelefonoPasajero) {
      return res.status(400).json({
        ok: false,
        mensaje: "El número de teléfono ya está en uso",
      });
    }

    // Crear usuario
    const usuario = new Usuario({
      nombre,
      correo,
      telefono,
      contrasenna: bcrypt.hashSync(contrasenna, 10),
      img,
      role,
    });

    const usuarioGuardado = await usuario.save();

    res.status(201).json({
      ok: true,
      usuario: usuarioGuardado,
    });

  } catch (err) {
    console.log("Error al crear usuario:", err);
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear usuario",
      errors: err.message || err,
    });
  }
};


//=================================================
// Actualizar un usuario
//=================================================
exports.actualizarUsuario = async (req, res) => {
  try {
    var id = req.params.id;
    var body = req.body;

    var usuario = await Usuario.findById(id).exec();

    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: `El usuario con el ID ${id} no existe`,
        errors: { message: 'No existe un usuario con ese ID' },
      });
    }

    // Verificar si el correo ya existe en usuario, conductores o pasajeros
    const [existeCorreoUsuario, existeCorreoConductor, existeCorreoPasajero] = await Promise.all([
      Usuario.findOne({ correo: body.correo }),
      Conductor.findOne({ correo: body.correo }),
      Pasajero.findOne({ correo: body.correo })
    ]);

    if (existeCorreoUsuario || existeCorreoConductor || existeCorreoPasajero) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El correo ya está en uso'
      });
    }

    // Verificar si el numero de telefono existe en usuarios, conductores o pasajeros
    const [existeTelefonoUsuario, existeTelefonoConductor, existeTelefonoPasajero] = await Promise.all([
      Usuario.findOne({ telefono: body.telefono }),
      Conductor.findOne({ telefono: body.telefono }),
      Pasajero.findOne({ telefono: body.telefono })
    ]);

    if (existeTelefonoUsuario || existeTelefonoConductor || existeTelefonoPasajero) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El número de teléfono ya está en uso'
      });
    }

    // usuario.nombre = body.nombre;
    // usuario.correo = body.correo;
    // usuario.telefono = body.telefono;  // Asegúrate de incluir el teléfono si es necesario
    // usuario.role = body.role;
    // Actualizar solo los campos proporcionados
    if (body.nombre) usuario.nombre = body.nombre;
    if (body.correo) usuario.correo = body.correo;
    if (body.telefono) usuario.telefono = body.telefono;
    if (body.role) usuario.role = body.role;


    var usuarioGuardado = await usuario.save();

    res.status(200).json({
      ok: true,
      usuario: usuarioGuardado,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar usuario',
      errors: err,
    });
  }
};

//=================================================
// Eliminar un usuario
//=================================================
exports.eliminarUsuario = async (req, res) => {
  try {
    const id = req.params.id;

    const usuarioBorrado = await Usuario.findByIdAndRemove(id);

    if (!usuarioBorrado) {
      return res.status(400).json({
        ok: false,
        mensaje: `El usuario con el ID ${id} no existe`,
        errors: { message: 'No existe un usuario con ese ID' },
      });
    }

    res.status(200).json({
      ok: true,
      usuario: usuarioBorrado,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al borrar usuario',
      errors: err,
    });
  }
};

