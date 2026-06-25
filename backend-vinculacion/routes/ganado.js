const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateGanado,
  validateId,
  validate,
} = require('../middleware/validation');
const {
  obtenerGanado,
  obtenerAnimal,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal,
} = require('../controllers/ganadoController');

router.use(protect);

router
  .route('/')
  .get(obtenerGanado)
  .post(validateGanado, validate, crearAnimal);

router
  .route('/:id')
  .get(validateId, validate, obtenerAnimal)
  .put([validateId, ...validateGanado], validate, actualizarAnimal)
  .delete(validateId, validate, eliminarAnimal);

module.exports = router;
