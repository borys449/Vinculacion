const express = require('express');
const router = express.Router();
const { protect, autorizar } = require('../middleware/auth');
const {
  validateId,
  validateUsuarioUpdate,
  validateAdminChangePassword,
  validate,
} = require('../middleware/validation');
const {
  obtenerUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarPassword,
} = require('../controllers/usuarioController');

// Todas las rutas requieren autenticación y rol de administrador
router.use(protect);
router.use(autorizar('administrador'));

router.route('/').get(obtenerUsuarios);

router
  .route('/:id')
  .get(validateId, validate, obtenerUsuario)
  .put([validateId, ...validateUsuarioUpdate], validate, actualizarUsuario)
  .delete(validateId, validate, eliminarUsuario);

router.put('/:id/password', [validateId, ...validateAdminChangePassword], validate, cambiarPassword);

module.exports = router;
