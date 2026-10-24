const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateCultivo,
  validateId,
  validate,
} = require('../middleware/validation');
const {
  obtenerCultivos,
  obtenerCultivo,
  crearCultivo,
  actualizarCultivo,
  eliminarCultivo,
} = require('../controllers/cultivoController');

router.use(protect);

router
  .route('/')
  .get(obtenerCultivos)
  .post(validateCultivo, validate, crearCultivo);

router
  .route('/:id')
  .get(validateId, validate, obtenerCultivo)
  .put([validateId, ...validateCultivo], validate, actualizarCultivo)
  .delete(validateId, validate, eliminarCultivo);

module.exports = router;
