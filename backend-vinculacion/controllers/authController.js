const { Usuario, Finca } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { getJwtSecret } = require('../config/jwt');

// Generar JWT Token
const generarToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

// Configuración base reutilizable para la cookie de sesión
const cookieOptions = {
  httpOnly: true, // 🔒 Blindado contra ataques XSS (no accesible vía JavaScript)
  secure: process.env.NODE_ENV === 'production', // false en desarrollo (HTTP), true en producción (HTTPS)
  sameSite: 'lax', // Requisito vital para que funcione compartiendo cookies entre diferentes puertos locales
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días de duración
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

    // Regla de seguridad y multi-tenancy: Quitar autorregistro público de operadores. Solo Administrador.
    if (tipo && tipo !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'El registro público está habilitado exclusivamente para Administradores de Finca. Los operadores (agricultores y ganaderos) deben ser registrados internamente por su Administrador.',
      });
    }

    // Crear usuario administrador
    const usuario = await Usuario.create({
      nombre,
      cedula,
      email,
      telefono,
      area: 'administracion',
      tipo: 'administrador',
      password,
    });

    // Crear finca propia para el nuevo Administrador
    let finca = null;
    if (Finca && typeof Finca.create === 'function') {
      try {
        const nombreFinca = (req.body.nombreFinca && typeof req.body.nombreFinca === 'string' && req.body.nombreFinca.trim()) 
          ? req.body.nombreFinca.trim() 
          : `Finca de ${nombre}`;

        finca = await Finca.create({
          nombre: nombreFinca,
          poligonoPerimetro: null,
          propietarioId: usuario.id,
        });
        if (typeof usuario.update === 'function') {
          await usuario.update({ fincaId: finca.id });
        }
      } catch (fincaErr) {
        console.warn('Aviso: No se pudo auto-crear la finca:', fincaErr.message);
      }
    }

    // Generar token
    const token = generarToken(usuario.id);

    // 🍪 Inyectar la cookie en la respuesta HTTP
    res.cookie('token', token, cookieOptions);

    const dataRes = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      tipo: usuario.tipo,
      area: usuario.area,
    };
    if (usuario.fincaId !== undefined || finca) {
      dataRes.fincaId = usuario.fincaId || finca?.id;
      dataRes.finca = finca ? { id: finca.id, nombre: finca.nombre, poligonoPerimetro: finca.poligonoPerimetro } : null;
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: dataRes,
    });
  } catch (error) {
    return res.status(400).json({
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

    // Buscar usuario por email o cédula
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

    // 🍪 Inyectar la cookie en la respuesta HTTP
    res.cookie('token', token, cookieOptions);

    const dataRes = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      tipo: usuario.tipo,
      area: usuario.area,
      cedula: usuario.cedula,
    };

    if (usuario.fincaId !== undefined) {
      let finca = null;
      if (Finca && typeof Finca.findByPk === 'function' && usuario.fincaId) {
        try {
          finca = await Finca.findByPk(usuario.fincaId);
        } catch (e) {}
      }
      dataRes.fincaId = usuario.fincaId;
      dataRes.finca = finca ? { id: finca.id, nombre: finca.nombre, poligonoPerimetro: finca.poligonoPerimetro } : null;
    }

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: dataRes,
    });
  } catch (error) {
    return res.status(400).json({
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
    const queryOptions = {
      attributes: { exclude: ['password'] },
    };
    if (Finca && typeof Finca.findByPk === 'function') {
      queryOptions.include = [
        {
          model: Finca,
          as: 'finca',
          attributes: ['id', 'nombre', 'poligonoPerimetro'],
        },
      ];
    }

    const usuario = await Usuario.findByPk(req.usuario.id, queryOptions);

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cerrar sesión (Destruir la cookie del navegador)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    return res.status(400).json({
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

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error) {
    return res.status(400).json({
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

    const isMatch = await bcrypt.compare(currentPassword, usuario.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
      });
    }

    await usuario.update({ password: newPassword });

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};