const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateGanadoCreate,
  validateGanadoUpdate,
  validateId,
  validate,
} = require('../middleware/validation');
const {
  obtenerGanado,
  obtenerAnimal,
  crearAnimal,
  actualizarAnimal,
  eliminarAnimal,
  obtenerControlLechero,
  obtenerResumenControlLechero,
  registrarOrdenio,
} = require('../controllers/ganadoController');

router.use(protect);
// Restringir módulo de ganado únicamente a personal de 'ganaderia' (y administradores)
router.use(autorizarArea('ganaderia'));

// Rutas globales de control lechero (deben ir antes de /:id)
router.get('/control-lechero/resumen', obtenerResumenControlLechero);

router
  .route('/')
  .get(obtenerGanado)
  .post(validateGanadoCreate, validate, crearAnimal);

// Rutas individuales de control lechero y registro de ordeño
router.get('/:id/control-lechero', validateId, validate, obtenerControlLechero);
router.post('/:id/ordenio', validateId, validate, registrarOrdenio);

router
  .route('/:id')
  .get(validateId, validate, obtenerAnimal)
  .put([validateId, ...validateGanadoUpdate], validate, actualizarAnimal)
  .delete(validateId, validate, eliminarAnimal);

module.exports = router;
