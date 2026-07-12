const { Ganado, Usuario } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todo el ganado activo
// @route   GET /api/ganado
// @access  Private
exports.obtenerGanado = async (req, res) => {
  try {
    const { search, estado, tipo } = req.query;
    let donde = {};

    // 1. Barra de Búsqueda: Filtra por identificación o raza (insensible a mayúsculas/minúsculas)
    if (search) {
      donde[Op.or] = [
        { identificacion: { [Op.iLike]: `%${search}%` } },
        { raza: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 2. Filtro por Estado de Gestión (activo, vendido, enfermo, etc.)
    if (estado) {
      donde.estado = estado;
    }

    // 3. Filtro por Tipo de Animal (bovino, porcino, etc.)
    if (tipo) {
      donde.tipo = tipo;
    }

    const ganado = await Ganado.findAll({
      where: {
        estado: 'activo' // 🚀 Filtra automáticamente para traer solo los animales activos
      },
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

// @desc    Obtener un animal por ID
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

// @desc    Crear un nuevo animal
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

// @desc    Actualizar un animal (Soporta el cambio de estado de forma automática)
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

    // Al actualizar dinámicamente con req.body, si pasas el campo 'estado' se guardará solo
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

// @desc    Eliminar un animal
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