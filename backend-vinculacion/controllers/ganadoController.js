const { Ganado, Usuario } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todo el ganado
// @route   GET /api/ganado
// @access  Private
exports.obtenerGanado = async (req, res) => {
  try {
    const ganado = await Ganado.findAll({
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }],
      order: [['fechaRegistro', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: ganado.length,
      data: ganado
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un animal
// @route   GET /api/ganado/:id
// @access  Private
exports.obtenerAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }]
    });

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear animal
// @route   POST /api/ganado
// @access  Private
exports.crearAnimal = async (req, res) => {
  try {
    const animal = await Ganado.create({
      ...req.body,
      responsableId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Animal registrado exitosamente',
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar animal
// @route   PUT /api/ganado/:id
// @access  Private
exports.actualizarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    await animal.update(req.body);
    await animal.reload();

    res.status(200).json({
      success: true,
      message: 'Animal actualizado exitosamente',
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.actualizarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal no encontrado' });
    }

    let datosActualizar = { ...req.body };

    // LÓGICA DE NEGOCIO: Automatización de alertas clínicas basadas en pesaje técnico
    if (req.body.pesoActual && animal.pesoInicial) {
      const pesoActualNum = parseFloat(req.body.pesoActual);
      const pesoInicialNum = parseFloat(animal.pesoInicial);

      // Si el animal perdió más del 10% de su peso inicial, el backend toma acción clínica autónoma
      if (pesoActualNum < pesoInicialNum * 0.9) {
        datosActualizar.estadoSalud = 'enfermo';
        datosActualizar.observaciones = `[ALERTA AUTOMÁTICA DEL BACKEND]: El animal ha bajado drásticamente de peso. Estado de salud degradado automáticamente a enfermo para revisión veterinaria urgente. ` + (req.body.observaciones || '');
      }
    }

    await animal.update(datosActualizar);
    await animal.reload();

    res.status(200).json({
      success: true,
      message: 'Datos del animal actualizados y evaluados por el sistema de control biológico',
      data: animal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// @desc    Eliminar animal
// @route   DELETE /api/ganado/:id
// @access  Private
exports.eliminarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    await animal.destroy();

    res.status(200).json({
      success: true,
      message: 'Animal eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};