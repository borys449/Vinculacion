const express = require('express');
const router = express.Router();
const { protect, autorizarArea } = require('../middleware/auth');
const uploadAnimalPhoto = require('../middleware/animalPhotoUpload');
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
  obtenerFotoAnimal,
} = require('../controllers/ganadoController');

router.use(protect);
router.use(autorizarArea('ganaderia'));

router.get('/control-lechero/resumen', obtenerResumenControlLechero);

router
  .route('/')
  .get(obtenerGanado)
  .post(uploadAnimalPhoto, validateGanadoCreate, validate, crearAnimal);

router.get('/:id/control-lechero', validateId, validate, obtenerControlLechero);
router.post('/:id/ordenio', validateId, validate, registrarOrdenio);

router
  .route('/:id')
  .get(validateId, validate, obtenerAnimal)
  .put([validateId, uploadAnimalPhoto, ...validateGanadoUpdate], validate, actualizarAnimal)
  .delete(validateId, validate, eliminarAnimal);

router.get('/:id/foto', validateId, validate, obtenerFotoAnimal);

module.exports = router;