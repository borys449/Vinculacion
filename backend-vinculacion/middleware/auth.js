const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { getJwtSecret } = require('../config/jwt');

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  let token;

  // 1. Primero intentamos leer el token desde las cookies HttpOnly
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // 2. Si no está en las cookies, buscamos en el header tradicional (Bearer)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Si no se encontró el token en ningún lado, rebotamos la petición
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, debe iniciar sesión'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, getJwtSecret());
    req.usuario = await Usuario.findByPk(decoded.id);
    
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar rol de administrador
exports.autorizar = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipo)) {
      return res.status(403).json({
        success: false,
        message: `Usuario tipo ${req.usuario.tipo} no tiene permisos para esta acción`
      });
    }
    next();
  };
};