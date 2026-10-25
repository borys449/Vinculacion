const { body, param, validationResult } = require('express-validator');

// Función helper para validar cédula ecuatoriana (Módulo 10) - 100% Offline
const validarCedulaEcuatoriana = (cedula) => {
  if (typeof cedula !== 'string') return false;
  
  // Debe tener exactamente 10 dígitos numéricos
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  // Provincias válidas en Ecuador: 1 a 24, o 30 para ecuatorianos en el exterior
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  const tercerDigito = parseInt(cedula.charAt(2), 10);
  // El tercer dígito para cédulas de personas naturales debe ser menor a 6
  if (tercerDigito >= 6) {
    return false;
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const totalObtenido = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return totalObtenido === digitoVerificador;
};

// Middleware para validar los resultados
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errArray = errors.array();
    // Log en servidor para diagnóstico rápido
    console.error('[Validation Error]', JSON.stringify(errArray, null, 2));
    return res.status(400).json({
      success: false,
      message: errArray.map((e) => e.msg).join(' | '),
      errors: errArray,
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
    .custom((value) => {
      if (!validarCedulaEcuatoriana(value)) {
        throw new Error('La cédula ecuatoriana ingresada no es válida');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .withMessage('Email inválido'),

  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[0-9]{10}$/)
    .withMessage('Teléfono inválido, debe contener 10 dígitos'),

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

// Validador exclusivo para CREAR (identificacion requerida)
exports.validateGanadoCreate = [
  body('identificacion')
    .notEmpty()
    .withMessage('La identificación del animal es requerida')
    .isLength({ max: 255 })
    .withMessage('La identificación no puede exceder los 255 caracteres'),
];

// Validador exclusivo para ACTUALIZAR (identificacion opcional)
exports.validateGanadoUpdate = [
  body('identificacion')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('La identificación no puede exceder los 255 caracteres'),
];

// Campos comunes a crear y actualizar
const validateGanadoCommon = [
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
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('La raza no puede exceder los 255 caracteres'),

  body('proposito')
    .optional({ checkFalsy: true })
    .isIn(['leche', 'carne', 'doble_proposito'])
    .withMessage('Propósito inválido. Debe ser leche, carne o doble_proposito'),

  body('produccionEstimadaDiaria')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('La producción estimada diaria debe ser un número positivo'),

  body('fechaNacimiento')
    .isISO8601()
    .withMessage('Fecha de nacimiento inválida'),

  body('sexo')
    .isIn(['macho', 'hembra'])
    .withMessage('Sexo inválido'),

  body('pesoInicial')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Peso inicial inválido'),

  body('pesoActual')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Peso actual inválido'),

  body('estadoSalud')
    .optional()
    .isIn([
      'sano',
      'en recuperacion',
      'enfermo',
    ])
    .withMessage('Estado de salud inválido'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser verdadero o falso'),

  body('estado')
    .optional()
    .isIn([
      'activo',
      'inactivo',
      'vendido',
      'enfermo',
      'gestacion',
      'fallecido',
    ])
    .withMessage('Estado del animal inválido'),
];

// Ensamblar listas completas para exportar
exports.validateGanadoCreate = [
  ...exports.validateGanadoCreate,
  ...validateGanadoCommon,
];

exports.validateGanadoUpdate = [
  ...exports.validateGanadoUpdate,
  ...validateGanadoCommon,
];

// Alias retrocompatible
exports.validateGanado = exports.validateGanadoCreate;

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
      'leche',
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