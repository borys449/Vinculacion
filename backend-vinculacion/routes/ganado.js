const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
<<<<<<< HEAD
  validateGanadoCreate,
  validateGanadoUpdate,
=======
  validateGanado,
>>>>>>> a358133f144632c0139a41238584ef31cf0270f7
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

// Rutas globales de control lechero (deben ir antes de /:id)
router.get('/control-lechero/resumen', obtenerResumenControlLechero);

router
  .route('/')
  .get(obtenerGanado)
<<<<<<< HEAD
  .post(validateGanadoCreate, validate, crearAnimal);
=======
  .post(validateGanado, validate, crearAnimal);
>>>>>>> a358133f144632c0139a41238584ef31cf0270f7

// Rutas individuales de control lechero y registro de ordeño
router.get('/:id/control-lechero', validateId, validate, obtenerControlLechero);
router.post('/:id/ordenio', validateId, validate, registrarOrdenio);

router
  .route('/:id')
  .get(validateId, validate, obtenerAnimal)
<<<<<<< HEAD
  .put([validateId, ...validateGanadoUpdate], validate, actualizarAnimal)
=======
  .put([validateId, ...validateGanado], validate, actualizarAnimal)
>>>>>>> a358133f144632c0139a41238584ef31cf0270f7
  .delete(validateId, validate, eliminarAnimal);

module.exports = router;
