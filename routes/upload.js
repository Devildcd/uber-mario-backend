const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const mongoose = require('mongoose');

const router = express.Router();

// Modelos
const Pasajero = require('../models/pasajero');
const Conductor = require('../models/conductor');
const Usuario = require('../models/usuario');

// Middleware de subida de archivos
router.use(fileUpload());
// Middleware de subida de archivos
// router.use(fileUpload({
//     limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5 MB
//     abortOnLimit: true,
//     responseOnLimit: 'El archivo es demasiado grande'
// }));
router.put('/:tipo/:id', async (req, res) => {
    const { tipo, id } = req.params;

    // 1. Validar tipo de colección
    const tiposValidos = ['pasajeros', 'conductores', 'usuarios'];
    if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no válido',
            errors: { message: `Tipos válidos: ${tiposValidos.join(', ')}` }
        });
    }

    // 2. Validar existencia de archivo
    if (!req.files || !req.files.imagen) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se seleccionó ningún archivo',
            errors: { message: 'Debe seleccionar una imagen' }
        });
    }

    // 3. Procesar imagen
    const imagen = req.files.imagen;
    //console.log('Archivo recibido:', imagen); // Depuración

    const extension = imagen.name.split('.').pop().toLowerCase();
    const extensionesValidas = ['png', 'jpg', 'jpeg', 'gif'];

    if (!extensionesValidas.includes(extension)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no permitida',
            errors: { message: `Extensiones válidas: ${extensionesValidas.join(', ')}` }
        });
    }

    // 4. Generar nombre único
    const nombreArchivo = `${id}-${Date.now()}.${extension}`;
    const uploadPath = `./uploads/${tipo}/${nombreArchivo}`;

    // 5. Mover archivo
    try {
        await imagen.mv(uploadPath);
        
        // 6. Actualizar base de datos
        const resultado = await actualizarImagen(tipo, id, nombreArchivo);
        
        res.json({
            ok: true,
            mensaje: 'Imagen actualizada correctamente',
            [tipo.slice(0, -1)]: resultado // Devuelve 'pasajero', 'conductor' o 'usuario'
            // imgUrl: `http://localhost:3000/img/${tipo}/${nombreArchivo}` // URL completa de la imagen
        });

    } catch (error) {
        console.error(error);
        
        // Eliminar archivo subido si hay error
        if (fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
        }

        res.status(500).json({
            ok: false,
            mensaje: 'Error al subir imagen',
            errors: error
        });
    }
});

async function actualizarImagen(tipo, id, nombreArchivo) {
    let modelo;
    switch (tipo) {
        case 'pasajeros':
            modelo = Pasajero;
            break;
        case 'conductores':
            modelo = Conductor;
            break;
        case 'usuarios':
            modelo = Usuario;
            break;
    }

    // Buscar y actualizar
    const entidad = await modelo.findById(id);
    if (!entidad) throw new Error(`${tipo.slice(0, -1)} no encontrado`);

    // Eliminar imagen anterior si existe
    const pathViejo = `./uploads/${tipo}/${entidad.img}`;
    if (fs.existsSync(pathViejo)) fs.unlinkSync(pathViejo);

    // Actualizar y guardar
    entidad.img = nombreArchivo;
    return await entidad.save();
}

module.exports = router;

// Probar interesante no te bloquea el hilo en modo produccion mejor q el de arriba probar 
// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const router = express.Router();

// ///////////////////////////////////////////////////////
// //          Mostrar Imagen por tipo código Original
// ///////////////////////////////////////////////////////
// router.get('/:tipo/:img', async (req, res) => {
//     const { tipo, img } = req.params;
//     const tiposValidos = ['pasajeros', 'conductores', 'usuarios'];
    
//     if (!tiposValidos.includes(tipo)) {
//         return res.sendFile(path.resolve('./assets/no-img.png'));
//     }

//     const pathImagen = path.resolve(`./uploads/${tipo}/${img}`);
    
//     try {
//         // Intentamos acceder a la imagen de forma asíncrona
//         await fs.promises.access(pathImagen);
//         // Si la imagen existe, se envía
//         res.sendFile(pathImagen);
//     } catch (err) {
//         // Si la imagen no existe, se envía la imagen por defecto
//         res.sendFile(path.resolve('./assets/no-img.png'));
//     }
// });

// module.exports = router;