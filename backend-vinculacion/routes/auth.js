const express = require('express');
const router = express.Router();
const {
  registro,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateLogin,
  validateUsuario,
  validate,
} = require('../middleware/validation');

router.post('/registro', validateUsuario, validate, registro);
router.post('/login', validateLogin, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
