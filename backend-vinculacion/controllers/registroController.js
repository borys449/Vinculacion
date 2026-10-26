const { Registro, Usuario, Cultivo, Ganado } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todos los registros (Bitácora) filtrados estrictamente por las relaciones de área
// @route   GET /api/registros
// @access  Private
exports.obtenerRegistros = async (req, res) => {
  try {
    let donde = {};

    // 🚀 Aislamiento estricto por ID de relación (Cultivo vs Ganado)
    if (req.usuario.tipo !== 'administrador') {
      if (req.usuario.area === 'cultivos') {
        donde = {
          [Op.and]: [
            { cultivoId: { [Op.not]: null } },
            { ganadoId: null }
          ]
        };
      } else if (req.usuario.area === 'ganaderia') {
        donde = {
          ganadoId: { [Op.not]: null }
        };
      }
    }

    const registros = await Registro.findAll({
      where: donde,
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre', 'tipo', 'area'] },
        { model: Cultivo, as: 'cultivo', attributes: ['id', 'nombre'] },
        { model: Ganado, as: 'ganado', attributes: ['id', 'identificacion'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: registros.length,
      data: registros
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Obtener un registro por ID
// @route   GET /api/registros/:id
// @access  Private
exports.obtenerRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre', 'tipo', 'area'] },
        { model: Cultivo, as: 'cultivo', attributes: ['id', 'nombre'] },
        { model: Ganado, as: 'ganado', attributes: ['id', 'identificacion'] }
      ]
    });

    if (!registro) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    res.status(200).json({ success: true, data: registro });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Crear un nuevo registro
// @route   POST /api/registros
// @access  Private
exports.crearRegistro = async (req, res) => {
  try {
    const nuevoRegistro = await Registro.create({
      ...req.body,
      registradoPorId: req.usuario.id
    });

    res.status(201).json({ success: true, data: nuevoRegistro });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Actualizar un registro
// @route   PUT /api/registros/:id
// @access  Private
exports.actualizarRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id);

    if (!registro) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    await registro.update(req.body);
    res.status(200).json({ success: true, data: registro });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Eliminar un registro
// @route   DELETE /api/registros/:id
// @access  Private
exports.eliminarRegistro = async (req, res) => {
  try {
    const registro = await Registro.findByPk(req.params.id);

    if (!registro) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    await registro.destroy();
    res.status(200).json({ success: true, message: 'Registro eliminado con éxito', data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Obtener resumen financiero filtrado por relaciones de área
// @route   GET /api/registros/resumen-financiero
// @access  Private
exports.obtenerResumenFinanciero = async (req, res) => {
  try {
    let donde = {};

    if (req.usuario.tipo !== 'administrador') {
      if (req.usuario.area === 'cultivos') {
        donde = {
          [Op.and]: [
            { cultivoId: { [Op.not]: null } },
            { ganadoId: null }
          ]
        };
      } else if (req.usuario.area === 'ganaderia') {
        donde = {
          ganadoId: { [Op.not]: null }
        };
      }
    }

    const registros = await Registro.findAll({ where: donde });
    let ingresos = 0;
    let costos = 0;

    registros.forEach(r => {
      ingresos += Number(r.ingresos || 0);
      costos += Number(r.costo || 0);
    });

    res.status(200).json({
      success: true,
      data: { ingresos, costos }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Obtener datos agregados para el Dashboard (Actividad reciente y gráfica) aislados por relaciones
// @route   GET /api/registros/dashboard-stats
// @access  Private
exports.obtenerDatosDashboard = async (req, res) => {
  try {
    let donde = {};

    // 🚀 Aislamiento estricto por IDs asociados en la base de datos
    if (req.usuario.tipo !== 'administrador') {
      if (req.usuario.area === 'cultivos') {
        donde = {
          [Op.and]: [
            { cultivoId: { [Op.not]: null } },
            { ganadoId: null }
          ]
        };
      } else if (req.usuario.area === 'ganaderia') {
        donde = {
          ganadoId: { [Op.not]: null }
        };
      }
    }

    // 1. Actividad reciente filtrada por las relaciones correctas
    const actividadReciente = await Registro.findAll({
      where: donde,
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre', 'tipo', 'area'] },
        { model: Cultivo, as: 'cultivo', attributes: ['id', 'nombre'] },
        { model: Ganado, as: 'ganado', attributes: ['id', 'identificacion'] }
      ],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    // 2. Tendencias financieras históricas (últimos 6 meses)
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
          ...donde,
          fecha: { [Op.between]: [inicioMes, finMes] }
        }
      });

      let ingresosMes = 0;
      let costosMes = 0;

      registrosMes.forEach(reg => {
        ingresosMes += Number(reg.ingresos || 0);
        costosMes += Number(reg.costo || 0);
      });

      datosGraficoTendencias.push({
        mes: nombreMes,
        ingresos: ingresosMes.toFixed(2),
        costos: costosMes.toFixed(2)
      });
    }

    res.status(200).json({
      success: true,
      data: { actividadReciente, datosGraficoTendencias }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};