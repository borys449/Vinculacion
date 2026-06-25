const { Registro, Usuario, Cultivo, Ganado } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todos los registros
// @route   GET /api/registros
// @access  Private
exports.obtenerRegistros = async (req, res) => {
  try {
    const registros = await Registro.findAll({
      include: [
        {
          model: Usuario,
          as: 'registradoPor',
          attributes: ['id', 'nombre', 'email'],
        },
        {
          model: Cultivo,
          as: 'cultivo',
          attributes: ['id', 'nombre', 'tipo'],
        },
        {
          model: Ganado,
          as: 'ganado',
          attributes: ['id', 'identificacion', 'tipo'],
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: registros.length,
      data: registros,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener un registro
// @route   GET /api/registros/:id
// @access  Private
exports.obtenerRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: 'registradoPor',
          attributes: ['id', 'nombre', 'email'],
        },
        {
          model: Cultivo,
          as: 'cultivo',
          attributes: ['id', 'nombre', 'tipo'],
        },
        {
          model: Ganado,
          as: 'ganado',
          attributes: ['id', 'identificacion', 'tipo'],
        },
      ],
    });

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: registro,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Crear registro
// @route   POST /api/registros
// @access  Private
exports.crearRegistro = async (req, res) => {
  try {
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    console.log('Usuario ID:', req.usuario?.id);

    const registro = await Registro.create({
      ...req.body,
      registradoPorId: req.usuario.id,
    });

    res.status(201).json({
      success: true,
      message: 'Registro creado exitosamente',
      data: registro,
    });
  } catch (error) {
    console.error('Error detallado:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error(
        'Validation errors:',
        JSON.stringify(error.errors, null, 2)
      );
    }

    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || null,
    });
  }
};

// @desc    Actualizar registro
// @route   PUT /api/registros/:id
// @access  Private
exports.actualizarRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    await registro.update(req.body);
    await registro.reload();

    res.status(200).json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: registro,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Eliminar registro
// @route   DELETE /api/registros/:id
// @access  Private
exports.eliminarRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    await registro.destroy();

    res.status(200).json({
      success: true,
      message: 'Registro eliminado exitosamente',
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
