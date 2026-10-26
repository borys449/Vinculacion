const express = require('express');
const router = express.Router();
const { protect, autorizarArea } = require('../middleware/auth');
const {
  validateRegistro,
  validateId,
  validate,
} = require('../middleware/validation');
const {
  obtenerRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
  obtenerResumenFinanciero,
  obtenerDatosDashboard,
} = require('../controllers/registroController');

router.use(protect);
router.use(autorizarArea('cultivos', 'ganaderia'));

// Rutas de estadísticas y agregados (deben ir antes de /:id para evitar colisión de rutas)
router.get('/dashboard-stats', obtenerDatosDashboard);
router.get('/resumen-financiero', obtenerResumenFinanciero);

router
  .route('/')
  .get(obtenerRegistros)
  .post(validateRegistro, validate, crearRegistro);

router
  .route('/:id')
  .get(validateId, validate, obtenerRegistro)
  .put([validateId, ...validateRegistro], validate, actualizarRegistro)
  .delete(validateId, validate, eliminarRegistro);

module.exports = router;
