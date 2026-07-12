const { Cultivo, Usuario } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todos los cultivos
// @route   GET /api/cultivos
// @access  Private
exports.obtenerCultivos = async (req, res) => {
  try {
    const cultivos = await Cultivo.findAll({
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }],
      order: [['fechaRegistro', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: cultivos.length,
      data: cultivos
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un cultivo
// @route   GET /api/cultivos/:id
// @access  Private
exports.obtenerCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }]
    });

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear cultivo
// @route   POST /api/cultivos
// @access  Private
exports.crearCultivo = async (req, res) => {
  try {
    let datosCultivo = { ...req.body };

    // LÓGICA DE NEGOCIO: Estimador predictivo del ciclo fenológico agrícola
    if (!datosCultivo.fechaCosechaEstimada && datosCultivo.fechaSiembra) {
      const fechaSiembra = new Date(datosCultivo.fechaSiembra);
      
      // Asignamos meses de maduración estimados según el tipo de cultivo de la base de datos
      let mesesMaduracion = 3; // Por defecto para vegetales/hortalizas comunes
      if (datosCultivo.tipo === 'frutal') mesesMaduracion = 12;
      if (datosCultivo.tipo === 'cereal') mesesMaduracion = 6;
      if (datosCultivo.tipo === 'leguminosa') mesesMaduracion = 4;

      fechaSiembra.setMonth(fechaSiembra.getMonth() + mesesMaduracion);
      datosCultivo.fechaCosechaEstimada = fechaSiembra.toISOString().split('T')[0];
      datosCultivo.observaciones = `[CÓMPUTO AUTOMÁTICO]: Fecha de cosecha estimada proyectada de forma autónoma a ${mesesMaduracion} meses plazo según el tipo de cultivo. ` + (datosCultivo.observaciones || '');
    }

    const cultivo = await Cultivo.create({
      ...datosCultivo,
      responsableId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Cultivo registrado y proyectado cronológicamente con éxito',
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Actualizar cultivo
// @route   PUT /api/cultivos/:id
// @access  Private
exports.actualizarCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    await cultivo.update(req.body);
    await cultivo.reload();

    res.status(200).json({
      success: true,
      message: 'Cultivo actualizado exitosamente',
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar cultivo
// @route   DELETE /api/cultivos/:id
// @access  Private
exports.eliminarCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    await cultivo.destroy();

    res.status(200).json({
      success: true,
      message: 'Cultivo eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};