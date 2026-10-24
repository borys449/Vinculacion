const { Usuario } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Private/Admin
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      order: [['fechaRegistro', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: usuarios.length,
      data: usuarios,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener un usuario
// @route   GET /api/usuarios/:id
// @access  Private/Admin
exports.obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // No permitir actualizar la contraseña desde aquí
    delete req.body.password;

    await usuario.update(req.body);
    await usuario.reload();

    // Excluir contraseña de la respuesta
    const usuarioSinPassword = usuario.toJSON();
    delete usuarioSinPassword.password;

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioSinPassword,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Eliminar usuario (desactivar)
// @route   DELETE /api/usuarios/:id
// @access  Private/Admin
exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // No permitir eliminar al propio usuario
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta',
      });
    }

    // Desactivar usuario en lugar de eliminar
    await usuario.update({ activo: false });

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cambiar contraseña de usuario
// @route   PUT /api/usuarios/:id/password
// @access  Private/Admin
exports.cambiarPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    }

    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    await usuario.update({ password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
