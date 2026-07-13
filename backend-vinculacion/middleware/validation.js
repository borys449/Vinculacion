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

// ===============================
// LOGIN
// ===============================
exports.validateLogin = [
  body('user')
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Usuario o email es requerido'),

  body('password')
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('La contraseña es requerida'),
];

// ===============================
// USUARIOS
// ===============================
exports.validateUsuario = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener al menos 3 caracteres'),

  body('cedula')
    .notEmpty()
    .withMessage('La cédula es requerida')
    .isLength({ min: 10, max: 13 })
    .withMessage('Cédula inválida'),

  body('email')
    .isEmail()
    .withMessage('Email inválido'),

  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/)
    .withMessage('Teléfono inválido'),

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
    .isLength({ min: 6, max: 255 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  }),
];

// ===============================
// CULTIVOS
// ===============================
exports.validateCultivo = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre del cultivo es requerido')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres'),

  body('tipo')
    .notEmpty()
    .withMessage('El tipo de cultivo es requerido')
    .isIn([
      'vegetal',
      'frutal',
      'cereal',
      'hortaliza',
      'leguminosa',
      'otro',
    ])
    .withMessage('Tipo de cultivo inválido'),

  body('area')
    .notEmpty()
    .withMessage('El área es requerida')
    .isFloat({ min: 0.01 })
    .withMessage('El área debe ser un número positivo'),

  body('unidad')
    .notEmpty()
    .withMessage('La unidad es requerida')
    .isIn(['metros', 'hectareas'])
    .withMessage('Unidad inválida'),

  body('ubicacion')
    .notEmpty()
    .withMessage('La ubicación es requerida')
    .trim()
    .isLength({ max: 255 })
    .withMessage('La ubicación no puede exceder 255 caracteres'),

  body('fechaSiembra')
    .notEmpty()
    .withMessage('La fecha de siembra es requerida')
    .isISO8601()
    .withMessage('Fecha inválida'),

  body('fechaCosechaEstimada')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Fecha de cosecha inválida')
    .custom((value, { req }) => {
      if (value && req.body.fechaSiembra) {
        const siembra = new Date(req.body.fechaSiembra);
        const cosecha = new Date(value);

        if (cosecha <= siembra) {
          throw new Error(
            'La fecha de cosecha estimada debe ser posterior a la fecha de siembra'
          );
        }
      }

      return true;
    }),

  body('estado')
    .optional()
    .isIn([
      'siembra',
      'crecimiento',
      'floracion',
      'cosecha',
      'completado',
    ])
    .withMessage('Estado del cultivo inválido'),

  body('responsableId')
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage('El ID del responsable debe ser un número entero válido'),
];

// ===============================
// GANADO
// ===============================
exports.validateGanado = [
  body('identificacion')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('La identificación no puede exceder los 255 caracteres'),

  body('tipo')
    .isIn([
      'bovino',
      'porcino',
      'ovino',
      'caprino',
      'avicola',
      'otro',
    ])
    .withMessage('Tipo de ganado inválido'),

  body('raza')
    .notEmpty()
    .withMessage('La raza es requerida'),

  body('fechaNacimiento')
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida'),

  body('sexo')
    .isIn(['macho', 'hembra'])
    .withMessage('Sexo inválido'),

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
    .isIn([
      'excelente',
      'bueno',
      'regular',
      'enfermo',
    ])
    .withMessage('Estado de salud inválido'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser verdadero o falso'),

  // En middleware/validation.js -> Reemplaza el bloque de 'estado' por este:

  body('estado')
    .optional()
    .isIn([
      'activo',
      'inactivo',
      'vendido',
      'gestacion',
      'fallecido'
    ])
    .withMessage('Estado del animal inválido'),
];

// ===============================
// REGISTROS
// ===============================
exports.validateRegistro = [
  body('tipo')
    .isIn([
      'cultivo',
      'ganado',
      'mantenimiento',
      'produccion',
      'venta',
      'otro',
    ])
    .withMessage('Tipo de registro inválido'),

  body('categoria')
    .notEmpty()
    .withMessage('La categoría es requerida'),

  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 5, max: 1000 })
    .withMessage('La descripción debe tener al menos 5 caracteres'),

  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),

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

  body('cultivoId')
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage('ID de cultivo inválido'),

  body('ganadoId')
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage('ID de ganado inválido'),
];

// ===============================
// ID
// ===============================
exports.validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido'),
];