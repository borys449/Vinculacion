const express = require('express');
const router = express.Router();
const { protect, autorizarArea } = require('../middleware/auth');
const {
  validateRegistro,
  validateId,
  validate,
} = require('../middleware/validation');
const {
  obtenerRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
  obtenerResumenFinanciero,
} = require('../controllers/registroController');
const { Registro, Usuario } = require('../models');
const { Op } = require('sequelize');

router.use(protect);
router.use(autorizarArea('cultivos', 'ganaderia'));

// 🚀 Ruta de estadísticas del dashboard implementada directamente para evitar errores 404
router.get('/dashboard-stats', async (req, res) => {
  try {
    // 1. Actividad reciente (últimos 5 registros)
    const actividadReciente = await Registro.findAll({
      include: [{
        model: Usuario,
        as: 'registradoPor',
        attributes: ['id', 'nombre', 'tipo', 'area']
      }],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    // 2. Tendencia financiera de los últimos 6 meses
    const fechaActual = new Date();
    const datosGraficoTendencias = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const anio = d.getFullYear();
      const mes = d.getMonth();
      const nombreMes = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });

      const inicioMes = new Date(anio, mes, 1, 0, 0, 0, 0);
      const finMes = new Date(anio, mes + 1, 0, 23, 59, 59, 999);

      const registrosMes = await Registro.findAll({
        where: {
          fecha: {
            [Op.between]: [inicioMes, finMes]
          }
        }
      });

      let ingresosMes = 0;
      let costosMes = 0;

      registrosMes.forEach(reg => {
        ingresosMes += Number(reg.ingresos || reg.cantidadIngreso || 0);
        costosMes += Number(reg.costo || reg.costos || reg.cantidadCosto || 0);
      });

      datosGraficoTendencias.push({
        mes: nombreMes,
        ingresos: ingresosMes.toFixed(2),
        costos: costosMes.toFixed(2)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        actividadReciente,
        datosGraficoTendencias
      }
    });
  } catch (error) {
    console.error('Error en dashboard-stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/resumen-financiero', obtenerResumenFinanciero);

router
  .route('/')
  .get(obtenerRegistros)
  .post(validateRegistro, validate, crearRegistro);

router
  .route('/:id')
  .get(validateId, validate, obtenerRegistro)
  .put([validateId, ...validateRegistro], validate, actualizarRegistro)
  .delete(validateId, validate, eliminarRegistro);

module.exports = router;