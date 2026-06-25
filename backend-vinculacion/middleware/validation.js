const { body, param, validationResult } = require('express-validator');

// Middleware para validar los resultados
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  next();
};

// Validaciones para autenticación
exports.validateLogin = [
  body('user').notEmpty().withMessage('Usuario o email es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

exports.validateUsuario = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener al menos 3 caracteres'),
  body('cedula')
    .notEmpty()
    .withMessage('La cédula es requerida')
    .isLength({ min: 10, max: 13 })
    .withMessage('Cédula inválida'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/)
    .withMessage('Teléfono inválido (10 dígitos)'),
  body('area')
    .isIn([
      'cultivos',
      'ganaderia',
      'mantenimiento',
      'administracion',
      'investigacion',
    ])
    .withMessage('Área inválida'),
  body('tipo')
    .isIn(['trabajador', 'administrador'])
    .withMessage('Tipo de usuario inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  }),
];

// Validaciones para cultivos
exports.validateCultivo = [
  body('nombre').notEmpty().withMessage('El nombre del cultivo es requerido'),
  body('tipo')
    .isIn(['vegetal', 'frutal', 'cereal', 'hortaliza', 'leguminosa', 'otro'])
    .withMessage('Tipo de cultivo inválido'),
  body('area')
    .isFloat({ min: 0 })
    .withMessage('El área debe ser un número positivo'),
  body('unidad').isIn(['metros', 'hectareas']).withMessage('Unidad inválida'),
  body('ubicacion').notEmpty().withMessage('La ubicación es requerida'),
  body('fechaSiembra').isISO8601().withMessage('Fecha de siembra inválida'),
  body('estado')
    .optional()
    .isIn(['siembra', 'crecimiento', 'floracion', 'cosecha', 'completado'])
    .withMessage('Estado inválido'),
];

// Validaciones para ganado
exports.validateGanado = [
  body('identificacion')
    .notEmpty()
    .withMessage('La identificación es requerida'),
  body('tipo')
    .isIn(['bovino', 'porcino', 'ovino', 'caprino', 'avicola', 'otro'])
    .withMessage('Tipo de ganado inválido'),
  body('raza').notEmpty().withMessage('La raza es requerida'),
  body('fechaNacimiento')
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida'),
  body('sexo').isIn(['macho', 'hembra']).withMessage('Sexo inválido'),
  body('pesoInicial')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso inicial inválido'),
  body('pesoActual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso actual inválido'),
  body('estadoSalud')
    .optional()
    .isIn(['excelente', 'bueno', 'regular', 'enfermo'])
    .withMessage('Estado de salud inválido'),
];

// Validaciones para registros
exports.validateRegistro = [
  body('tipo')
    .isIn(['cultivo', 'ganado', 'mantenimiento', 'produccion', 'venta', 'otro'])
    .withMessage('Tipo de registro inválido'),
  body('categoria').notEmpty().withMessage('La categoría es requerida'),
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 5 })
    .withMessage('La descripción debe tener al menos 5 caracteres'),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida'),
  body('cantidad')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La cantidad debe ser positiva'),
  body('costo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El costo debe ser positivo'),
  body('ingresos')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Los ingresos deben ser positivos'),
  body('cultivoId').optional().isInt().withMessage('ID de cultivo inválido'),
  body('ganadoId').optional().isInt().withMessage('ID de ganado inválido'),
];

// Validación de ID en parámetros
exports.validateId = [param('id').isInt({ min: 1 }).withMessage('ID inválido')];
