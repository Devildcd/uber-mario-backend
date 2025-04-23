const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();


///////////////////////////////////////////////////////
//          Mostrar Imagen por tipo codigo Original
///////////////////////////////////////////////////////
router.get('/:tipo/:img', (req, res) => {
    const { tipo, img } = req.params;
    const tiposValidos = ['pasajeros', 'conductores', 'usuarios'];
    
    if (!tiposValidos.includes(tipo)) {
        return res.sendFile(path.resolve('./assets/no-img.png'));
    }

    const pathImagen = path.resolve(`./uploads/${tipo}/${img}`);
    
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        res.sendFile(path.resolve('./assets/no-img.png'));
    }
});

module.exports = router;

///////////////////////////////////////////////////////
//   Mostrar Imagen por tipo 
///////////////////////////////////////////////////////
// Crear carpetas si no existen
// const carpetas = ['./uploads/pasajero', './uploads/conductor', './uploads/usuario']; // Cambia a singular
// carpetas.forEach((carpeta) => {
//     if (!fs.existsSync(carpeta)) {
//         fs.mkdirSync(carpeta, { recursive: true });
//     }
// });

// router.get('/:tipo/:img', (req, res) => {
//     const { tipo, img } = req.params;
//     const tiposValidos = ['pasajero', 'conductor', 'usuario']; // Cambia a singular
    
//     if (!tiposValidos.includes(tipo)) {
//         const pathImagenDefault = path.resolve('./assets/no-img.png');
//         if (fs.existsSync(pathImagenDefault)) {
//             return res.sendFile(pathImagenDefault);
//         } else {
//             return res.status(404).json({
//                 ok: false,
//                 mensaje: 'Imagen por defecto no encontrada'
//             });
//         }
//     }

//     const pathImagen = path.resolve(`./uploads/${tipo}/${img}`);
//     console.log('Ruta de la imagen:', pathImagen); // Depuración
    
//     if (fs.existsSync(pathImagen)) {
//         res.sendFile(pathImagen);
//     } else {
//         const pathImagenDefault = path.resolve('./assets/no-img.jpg');
//         if (fs.existsSync(pathImagenDefault)) {
//             res.sendFile(pathImagenDefault);
//         } else {
//             res.status(404).json({
//                 ok: false,
//                 mensaje: 'Imagen no encontrada'
//             });
//         }
//     }
// });

// module.exports = router;

