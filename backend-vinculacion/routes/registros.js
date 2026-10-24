const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
} = require('../controllers/registroController');

router.use(protect);

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
