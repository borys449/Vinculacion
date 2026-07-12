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
  body('user').notEmpty().isLength({ max: 255 }).withMessage('Usuario o email es requerido'),
  body('password').notEmpty().isLength({ max: 255 }).withMessage('La contraseña es requerida'),
];

// Validaciones para usuarios
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
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .isLength({ max: 20 })
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
    .isLength({ min: 6, max: 255 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  }),
];

// Validaciones para cultivos (¡REESTRUCTURADO Y LIMPIO!)
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
    .isIn(['vegetal', 'frutal', 'cereal', 'hortaliza', 'leguminosa', 'otro'])
    .withMessage('Tipo de cultivo inválido. Valores permitidos: vegetal, frutal, cereal, hortaliza, leguminosa, otro'),

  body('area')
    .notEmpty()
    .withMessage('El área es requerida')
    .isFloat({ min: 0.01 })
    .withMessage('El área debe ser un número positivo mayor a 0'),

  body('unidad')
    .notEmpty()
    .withMessage('La unidad de medida es requerida')
    .isIn(['metros', 'hectareas'])
    .withMessage('Unidad inválida. Valores permitidos: metros, hectareas'),

  body('ubicacion')
    .notEmpty()
    .withMessage('La ubicación o lote de la finca es requerida')
    .trim()
    .isLength({ max: 255 })
    .withMessage('La ubicación no puede exceder los 255 caracteres'),

  body('fechaSiembra')
    .notEmpty()
    .withMessage('La fecha de siembra es requerida')
    .isISO8601()
    .withMessage('Formato de fecha de siembra inválido (Debe ser AAAA-MM-DD)')
    .custom((value) => {
      const fechaSiembra = new Date(value);
      const hoy = new Date();
      // Evitamos que registren siembras con más de un año en el futuro por error
      hoy.setFullYear(hoy.getFullYear() + 1);
      if (fechaSiembra > hoy) {
        throw new Error('La fecha de siembra no puede ser una fecha tan lejana en el futuro');
      }
      return true;
    }),

  body('fechaCosechaEstimada')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Formato de fecha de cosecha estimada inválido (Debe ser AAAA-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.body.fechaSiembra) {
        const fechaSiembra = new Date(req.body.fechaSiembra);
        const fechaCosecha = new Date(value);
        if (fechaCosecha <= fechaSiembra) {
          throw new Error('La fecha de cosecha estimada debe ser posterior a la fecha de siembra');
        }
      }
      return true;
    }),

  body('estado')
    .optional()
    .isIn(['siembra', 'crecimiento', 'floracion', 'cosecha', 'completado'])
    .withMessage('Estado del cultivo inválido. Valores permitidos: siembra, crecimiento, floracion, cosecha, completado'),

  body('responsableId')
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage('El ID del responsable debe ser un número entero válido'),
];

// Validaciones para ganado
exports.validateGanado = [
  body('identificacion')
    .optional({ checkFalsy: true }) // 🔒 CAMBIO CLAVE: Permite que vaya vacío para que actúe el autogenerador del backend
    .isLength({ max: 255 })
    .withMessage('La identificación no puede exceder los 255 caracteres'),
  body('tipo')
    .isIn(['bovino', 'porcino', 'ovino', 'caprino', 'avicola', 'otro'])
    .withMessage('Tipo de ganado inválido'),
  body('raza').notEmpty().withMessage('La raza es requerida'),
  body('fechaNacimiento')
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida (Debe ser AAAA-MM-DD)'),
  body('sexo').isIn(['macho', 'hembra']).withMessage('Sexo inválido'),
  body('pesoInicial')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso inicial inválido debe ser un número positivo'),
  body('pesoActual')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso actual inválido debe ser un número positivo'),
  body('estadoSalud')
    .optional()
    .isIn(['excelente', 'bueno', 'regular', 'enfermo'])
    .withMessage('Estado de salud inválido'),
  body('estado')
    .optional()
    .isIn(['disponible', 'vendido', 'fallecido']) // 🔄 Control del ciclo de vida contable
    .withMessage('Estado de disponibilidad inválido'),
];

// Validaciones para registros financieros
exports.validateRegistro = [
  body('tipo')
    .isIn(['cultivo', 'ganado', 'mantenimiento', 'produccion', 'venta', 'otro'])
    .withMessage('Tipo de registro inválido'),
  body('categoria').notEmpty().withMessage('La categoría es requerida'),
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 5, max: 1000 })
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
  body('cultivoId').optional({ checkFalsy: true }).isInt().withMessage('ID de cultivo inválido'),
  body('ganadoId').optional({ checkFalsy: true }).isInt().withMessage('ID de ganado inválido'),
];

// Validación de ID en parámetros
exports.validateId = [param('id').isInt({ min: 1 }).withMessage('ID inválido')];