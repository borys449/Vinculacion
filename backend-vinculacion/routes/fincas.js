const express = require('express');
const router = express.Router();
const { protect, autorizar } = require('../middleware/auth');
const {
  obtenerMiFinca,
  actualizarPerimetro,
  eliminarMapaCompleto
} = require('../controllers/fincaController');

router.use(protect);

router.get('/mi-finca', obtenerMiFinca);
router.put('/mi-finca/perimetro', autorizar('administrador'), actualizarPerimetro);
router.delete('/mi-finca/mapa', autorizar('administrador'), eliminarMapaCompleto);

module.exports = router;
