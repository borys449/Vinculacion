const express = require('express');
const router = express.Router();
const { protect, autorizar } = require('../middleware/auth');
const {
  obtenerMiFinca,
  actualizarPerimetro
} = require('../controllers/fincaController');

router.use(protect);

router.get('/mi-finca', obtenerMiFinca);
router.put('/mi-finca/perimetro', autorizar('administrador'), actualizarPerimetro);

module.exports = router;
