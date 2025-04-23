//JWT
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
//semilla del token 
var SEED = require('../config/config').SEED;



//=================================================
//Verificar token
//=================================================

exports.verificaToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;

  if (!token) {
      return res.status(401).json({
          ok: false,
          mensaje: 'Token no proporcionado'
      });
  }

  jwt.verify(token, SEED, async (err, decoded) => {
      if (err) {
          return res.status(401).json({
              ok: false,
              mensaje: 'Token inválido',
              errors: err
          });
      }

      // Buscar usuario en la colección correspondiente
      let modelo;
      switch (decoded.tipoUsuario) {
          case 'pasajero':
              modelo = mongoose.model('Pasajero');
              break;
          case 'conductor':
              modelo = mongoose.model('Conductor');
              break;
          case 'admin':
              modelo = mongoose.model('Usuario');
              break;
          default:
              return res.status(401).json({
                  ok: false,
                  mensaje: 'Tipo de usuario no válido'
              });
      }

      const usuario = await modelo.findById(decoded.id);
      if (!usuario) {
          return res.status(404).json({
              ok: false,
              mensaje: 'Usuario no encontrado'
          });
      }

      req.usuario = usuario.toObject();
      req.usuario.tipo = decoded.tipoUsuario; // Agregar tipo de usuario

       // Verificar si el token está a punto de expirar (por ejemplo, en menos de 5 minutos)
       const ahora = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
       const tiempoRestante = decoded.exp - ahora; // Tiempo restante en segundos

       if (tiempoRestante < 300) { // 300 segundos = 5 minutos
           // Emitir un nuevo token de acceso
           const nuevoToken = jwt.sign(
               { id: decoded.id, tipoUsuario: decoded.tipoUsuario },
               SEED,
               { expiresIn: '15m' } // Nuevo token válido por 15minutos hora
           );

           // Adjuntar el nuevo token al response
           res.set('Authorization', `Bearer ${nuevoToken}`);
           //console.log('Nuevo token generado:', nuevoToken); // Depuración
       }
      next();
  });
};

exports.renovarToken = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Verificar el token de actualización
        const decoded = jwt.verify(refreshToken, SEED);

        // Emitir un nuevo token de acceso
        const nuevoToken = jwt.sign(
            { id: decoded.id, tipoUsuario: decoded.tipoUsuario },
            SEED,
            { expiresIn: '1h' } // Token de acceso válido por 1 hora
        );

        res.status(200).json({
            ok: true,
            token: nuevoToken
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({
            ok: false,
            mensaje: 'Token de actualización inválido o expirado'
        });
    }
};

// ==========================================
//  Verificar ADMIN
// ==========================================
exports.verificaAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'admin' || !['ADMIN_ROLE', 'SUPERADMIN_ROLE'].includes(req.usuario.role)) {
      return res.status(403).json({
          ok: false,
          mensaje: 'Acceso denegado: Se requiere rol de administrador'
      });
  }
  next();
};


// ==========================================
//  Verificar ADMIN o Mismo Usuario
// ==========================================
exports.verificaAdminOMismoUsuario = (req, res, next) => {
  const { id } = req.params;
  const { tipo, _id, role } = req.usuario;

  // Permitir a admins y al propio usuario
  if (tipo === 'admin' && ['ADMIN_ROLE', 'SUPERADMIN_ROLE'].includes(role)) {
      return next();
  }

  // Permitir si el ID coincide (para cualquier rol)
  if (_id.toString() === id) {
      return next();
  }

  res.status(403).json({
      ok: false,
      mensaje: 'No tienes permisos para esta acción'
  });
};

// ==========================================
//   Conductores
// ==========================================

exports.verificaConductor = (req, res, next) => {
  if (req.usuario.tipo !== 'conductor') {
      return res.status(403).json({ ok: false, mensaje: 'Acceso solo para conductores' });
  }
  next();
};

// Uso:ejemplo de uso
// router.patch('/viajes/:id/aceptar', verificaToken, verificaConductor, aceptarViaje);

// ==========================================
//   Pasajeros
// ==========================================
exports.verificaPasajero = (req, res, next) => {
  if (req.usuario.tipo !== 'pasajero') {
      return res.status(403).json({ ok: false, mensaje: 'Acceso solo para pasajeros' });
  }
  next();
};

//  Descripcion modo de uso
//   Pasajero solicita viaje:
// POST /viajes/solicitar (verificaToken + verificaPasajero)

// Conductor acepta viaje:
// PATCH /viajes/665/aceptar (verificaToken + verificaConductor)

// Admin monitorea viajes:
// GET /admin/viajes (verificaToken + verificaAdmin)

// Pasajero califica viaje:
// POST /viajes/665/calificar (verificaToken + verificaPasajero)

// Usuario actualiza su perfil:
// PUT /pasajeros/123 (verificaToken + verificaAdminOMismoUsuario)