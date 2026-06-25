const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Generar JWT Token
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'clave_secreta_default', {
    expiresIn: '30d',
  });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/registro
// @access  Public
exports.registro = async (req, res) => {
  try {
    const {
      nombre,
      cedula,
      email,
      telefono,
      area,
      tipo,
      password,
      confirmPassword,
    } = req.body;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden',
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExiste = await Usuario.findOne({
      where: {
        [Op.or]: [{ email }, { cedula }],
      },
    });

    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email o cédula',
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      cedula,
      email,
      telefono,
      area,
      tipo,
      password,
    });

    // Generar token
    const token = generarToken(usuario.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: usuario.tipo,
        area: usuario.area,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { user, password } = req.body;

    // Validar datos
    if (!user || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese email/cédula y contraseña',
      });
    }

    // Buscar usuario por email o cédula (sin requerir tipo)
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [{ email: user }, { cedula: user }],
      },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña
    const esContrasenaCorrecta = await usuario.matchPassword(password);

    if (!esContrasenaCorrecta) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generarToken(usuario.id);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: usuario.tipo,
        area: usuario.area,
        cedula: usuario.cedula,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] },
    });

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

// @desc    Actualizar perfil del usuario actual
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;

    const usuario = await Usuario.findByPk(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== usuario.email) {
      const emailExiste = await Usuario.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso',
        });
      }
    }

    await usuario.update({
      nombre: nombre || usuario.nombre,
      email: email || usuario.email,
      telefono: telefono || usuario.telefono,
    });

    const usuarioActualizado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['password'] },
    });

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cambiar contraseña del usuario actual
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar la contraseña actual y la nueva',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, usuario.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
      });
    }

    // Actualizar contraseña
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
