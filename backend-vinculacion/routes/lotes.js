const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  obtenerLotes,
  obtenerLote,
  crearLote,
  actualizarLote,
  eliminarLote
} = require('../controllers/loteController');

router.use(protect);

router.route('/')
  .get(obtenerLotes)
  .post(crearLote);

router.route('/:id')
  .get(obtenerLote)
  .put(actualizarLote)
  .delete(eliminarLote);

module.exports = router;
