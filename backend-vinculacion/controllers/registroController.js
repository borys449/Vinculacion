const { Registro, Usuario, Cultivo, Ganado } = require('../models');
const { Op } = require('sequelize');

// Función auxiliar para construir el filtro estricto por área
const construirFiltroArea = (usuario, areaParam, soloFinancierosUOperativos = true) => {
  let baseFiltro = {};

  if (!usuario) {
    if (areaParam === 'cultivos' || areaParam === 'ganaderia') {
      baseFiltro = obtenerReglasPorArea(areaParam);
    }
  } else {
    let areaTarget = null;
    if (usuario.tipo !== 'administrador') {
      areaTarget = usuario.area;
    } else if (areaParam && areaParam !== 'global' && areaParam !== 'todos') {
      areaTarget = areaParam;
    }

    if (areaTarget === 'cultivos' || areaTarget === 'ganaderia') {
      baseFiltro = obtenerReglasPorArea(areaTarget);
    }
  }

  // Filtrado estricto para excluir eventos de auditoría y actualizaciones automáticas
  if (soloFinancierosUOperativos) {
    return {
      [Op.and]: [
        baseFiltro,
        {
          categoria: {
            [Op.notIn]: ['Actualización', 'Creación de Animal', 'Creación de Cultivo']
          }
        },
        {
          descripcion: {
            [Op.notLike]: '%Actualizó:%'
          }
        }
      ]
    };
  }

  return baseFiltro;
};

const obtenerReglasPorArea = (area) => {
  if (area === 'cultivos') {
    return {
      [Op.and]: [
        { ganadoId: null },
        { tipo: { [Op.notIn]: ['ganado', 'leche'] } },
        {
          [Op.or]: [
            { cultivoId: { [Op.not]: null } },
            { tipo: 'cultivo' }
          ]
        }
      ]
    };
  }

  if (area === 'ganaderia') {
    return {
      [Op.and]: [
        { cultivoId: null },
        { tipo: { [Op.ne]: 'cultivo' } },
        {
          [Op.or]: [
            { ganadoId: { [Op.not]: null } },
            { tipo: { [Op.in]: ['ganado', 'leche'] } }
          ]
        }
      ]
    };
  }

  return {};
};

// @desc    Obtener todos los registros (Registros financieros limpios)
// @route   GET /api/registros
// @access  Private
exports.obtenerRegistros = async (req, res) => {
  try {
    const soloOperativos = req.query.operativos !== 'false';
    const donde = construirFiltroArea(req.usuario, req.query.area, soloOperativos);

    const registros = await Registro.findAll({
      where: donde,
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre', 'tipo', 'area'], required: false },
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

// @desc    Crear un nuevo registro garantizando respuesta exitosa
// @route   POST /api/registros
// @access  Private
exports.crearRegistro = async (req, res) => {
  try {
    let datosCreacion = {
      ...req.body,
      registradoPorId: req.usuario.id
    };

    if (req.usuario && req.usuario.tipo !== 'administrador') {
      if (req.usuario.area === 'cultivos') {
        datosCreacion.ganadoId = null;
      } else if (req.usuario.area === 'ganaderia') {
        datosCreacion.cultivoId = null;
      }
    }

    if (!datosCreacion.costo) datosCreacion.costo = 0;
    if (!datosCreacion.ingresos) datosCreacion.ingresos = 0;
    if (!datosCreacion.cantidad) datosCreacion.cantidad = 0;

    const nuevoRegistro = await Registro.create(datosCreacion);

    res.status(201).json({ success: true, data: nuevoRegistro });
  } catch (error) {
    console.error('Error al crear registro:', error);
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

// @desc    Obtener resumen financiero
// @route   GET /api/registros/resumen-financiero
// @access  Private
exports.obtenerResumenFinanciero = async (req, res) => {
  try {
    const donde = construirFiltroArea(req?.usuario, req?.query?.area, true);

    let ingresos = 0;
    let costos = 0;

    const registros = await Registro.findAll({
      where: donde,
      attributes: ['ingresos', 'costo']
    });

    registros.forEach(r => {
      ingresos += Number(r.ingresos || 0);
      costos += Number(r.costo || 0);
    });

    const balance = Number((ingresos - costos).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        ingresos,
        costos,
        balance
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Obtener datos agregados para el Dashboard
// @route   GET /api/registros/dashboard-stats
// @access  Private
exports.obtenerDatosDashboard = async (req, res) => {
  try {
    const donde = construirFiltroArea(req?.usuario, req?.query?.area, false);
    const dondeFinanciero = construirFiltroArea(req?.usuario, req?.query?.area, true);

    const actividadReciente = await Registro.findAll({
      where: donde,
      include: [
        { model: Usuario, as: 'registradoPor', attributes: ['id', 'nombre', 'tipo', 'area'], required: false },
        { model: Cultivo, as: 'cultivo', attributes: ['id', 'nombre'] },
        { model: Ganado, as: 'ganado', attributes: ['id', 'identificacion'] }
      ],
      order: [['fecha', 'DESC']],
      limit: 5
    });

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();

    const inicioPeriodo = new Date(anioActual, mesActual - 5, 1, 0, 0, 0, 0);
    const finPeriodo = new Date(anioActual, mesActual + 1, 0, 23, 59, 59, 999);

    const registrosHistoricos = await Registro.findAll({
      where: {
        ...dondeFinanciero,
        fecha: { [Op.between]: [inicioPeriodo, finPeriodo] }
      }
    });

    const datosGraficoTendencias = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - i, 1);
      const anio = d.getFullYear();
      const mes = d.getMonth();
      const nombreMes = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });

      let ingresosMes = 0;
      let costosMes = 0;

      registrosHistoricos.forEach(reg => {
        const f = new Date(reg.fecha);
        if (f.getFullYear() === anio && f.getMonth() === mes) {
          ingresosMes += Number(reg.ingresos || 0);
          costosMes += Number(reg.costo || 0);
        }
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
    res.status(500).json({ success: false, message: error.message });
  }
};