const { Lote, Usuario, Registro } = require('../models');

// Función auxiliar para validar permisos según la rama (agricultura vs ganadería)
const puedeGestionarRama = (usuario, tipoLote) => {
  if (usuario.tipo === 'administrador') return true;
  if (usuario.area === 'cultivos' && tipoLote === 'agricultura') return true;
  if (usuario.area === 'ganaderia' && tipoLote === 'ganaderia') return true;
  return false;
};

// @desc    Obtener todos los lotes de la finca (visibilidad cruzada)
// @route   GET /api/lotes
// @access  Private
exports.obtenerLotes = async (req, res) => {
  try {
    const lotes = await Lote.findAll({
      where: { fincaId: req.usuario.fincaId },
      include: [
        {
          model: Usuario,
          as: 'creadoPor',
          attributes: ['id', 'nombre', 'tipo', 'area']
        }
      ],
      order: [['fechaRegistro', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: lotes.length,
      data: lotes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un lote por ID
// @route   GET /api/lotes/:id
// @access  Private
exports.obtenerLote = async (req, res) => {
  try {
    const lote = await Lote.findOne({
      where: {
        id: req.params.id,
        fincaId: req.usuario.fincaId
      },
      include: [
        {
          model: Usuario,
          as: 'creadoPor',
          attributes: ['id', 'nombre', 'tipo', 'area']
        }
      ]
    });

    if (!lote) {
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado en esta finca'
      });
    }

    res.status(200).json({
      success: true,
      data: lote
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear un nuevo lote
// @route   POST /api/lotes
// @access  Private
exports.crearLote = async (req, res) => {
  try {
    const { nombre, tipo, geometria } = req.body;

    if (!nombre || !tipo || !geometria) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, tipo de rama (agricultura/ganaderia) y geometría GeoJSON son obligatorios.'
      });
    }

    if (!['agricultura', 'ganaderia'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "El tipo de lote debe ser 'agricultura' o 'ganaderia'."
      });
    }

    // Regla de negocio: Agricultores y ganaderos solo gestionan su propia rama
    if (!puedeGestionarRama(req.usuario, tipo)) {
      return res.status(403).json({
        success: false,
        message: `Acción denegada: Su rol/área (${req.usuario.area || req.usuario.tipo}) no tiene permisos para crear lotes de ${tipo}.`
      });
    }

    const nuevoLote = await Lote.create({
      nombre,
      tipo,
      geometria,
      fincaId: req.usuario.fincaId,
      creadoPorId: req.usuario.id
    });

    // Registrar en la Bitácora con autoría, rol y usuario
    await Registro.create({
      tipo: 'lote',
      categoria: 'Creación de Lote',
      descripcion: `El usuario ${req.usuario.nombre} (Rol: ${req.usuario.tipo}, Área: ${req.usuario.area}) creó el lote '${nuevoLote.nombre}' asignado a la rama de ${nuevoLote.tipo}.`,
      fecha: new Date(),
      fincaId: req.usuario.fincaId,
      loteId: nuevoLote.id,
      registradoPorId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Lote creado exitosamente y registrado en la bitácora',
      data: nuevoLote
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar un lote
// @route   PUT /api/lotes/:id
// @access  Private
exports.actualizarLote = async (req, res) => {
  try {
    const lote = await Lote.findOne({
      where: {
        id: req.params.id,
        fincaId: req.usuario.fincaId
      }
    });

    if (!lote) {
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado'
      });
    }

    // Validar permisos sobre la rama del lote
    if (!puedeGestionarRama(req.usuario, lote.tipo)) {
      return res.status(403).json({
        success: false,
        message: `Acción denegada: Solo los operadores de la rama ${lote.tipo} o el Administrador pueden modificar este lote.`
      });
    }

    if (req.body.tipo && req.body.tipo !== lote.tipo && !puedeGestionarRama(req.usuario, req.body.tipo)) {
      return res.status(403).json({
        success: false,
        message: `No tiene permiso para cambiar el lote a la rama ${req.body.tipo}.`
      });
    }

    const datosAnteriores = `${lote.nombre} (${lote.tipo})`;
    await lote.update(req.body);
    await lote.reload();

    // Registrar en la Bitácora
    await Registro.create({
      tipo: 'lote',
      categoria: 'Actualización de Lote',
      descripcion: `El usuario ${req.usuario.nombre} (Rol: ${req.usuario.tipo}, Área: ${req.usuario.area}) actualizó el lote '${lote.nombre}' (${lote.tipo}). Estado previo: ${datosAnteriores}.`,
      fecha: new Date(),
      fincaId: req.usuario.fincaId,
      loteId: lote.id,
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Lote actualizado exitosamente y registrado en bitácora',
      data: lote
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar un lote
// @route   DELETE /api/lotes/:id
// @access  Private
exports.eliminarLote = async (req, res) => {
  try {
    const lote = await Lote.findOne({
      where: {
        id: req.params.id,
        fincaId: req.usuario.fincaId
      }
    });

    if (!lote) {
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado'
      });
    }

    // Validar permisos sobre la rama del lote
    if (!puedeGestionarRama(req.usuario, lote.tipo)) {
      return res.status(403).json({
        success: false,
        message: `Acción denegada: Solo los operadores de la rama ${lote.tipo} o el Administrador pueden eliminar este lote.`
      });
    }

    const nombreLote = lote.nombre;
    const tipoLote = lote.tipo;

    await lote.destroy();

    // Registrar en la Bitácora
    await Registro.create({
      tipo: 'lote',
      categoria: 'Eliminación de Lote',
      descripcion: `El usuario ${req.usuario.nombre} (Rol: ${req.usuario.tipo}, Área: ${req.usuario.area}) eliminó el lote '${nombreLote}' de la rama ${tipoLote}.`,
      fecha: new Date(),
      fincaId: req.usuario.fincaId,
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Lote eliminado exitosamente y registrado en bitácora',
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
