const { Ganado, Usuario, Registro } = require('../models');
const { Op } = require('sequelize');
const {
  validarRangosBiologicos,
  calcularProduccionLechera,
  calcularEdadEnMeses,
} = require('../utils/ganaderiaUtils');

// Helper para obtener rango de fechas del mes actual
const getRangoMesActual = (referencia = new Date()) => {
  const inicioMes = new Date(referencia.getFullYear(), referencia.getMonth(), 1, 0, 0, 0, 0);
  const finMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 23, 59, 59, 999);
  return { inicioMes, finMes };
};

// @desc    Obtener todo el ganado (Soporta filtros por búsqueda, estado, tipo y propósito)
// @route   GET /api/ganado
// @access  Private
exports.obtenerGanado = async (req, res) => {
  try {
    const { search, estado, tipo, proposito } = req.query;
    let donde = {};

    // 1. Barra de Búsqueda: Filtra por identificación o raza
    if (search) {
      donde[Op.or] = [
        { identificacion: { [Op.iLike]: `%${search}%` } },
        { raza: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 2. Filtro por Estado de Gestión
    if (estado && estado !== 'todos') {
      donde.estado = estado;
    }

    // 3. Filtro por Tipo de Animal (bovino, porcino, etc.)
    if (tipo) {
      donde.tipo = tipo;
    }

    // 4. Filtro por Propósito (leche, carne, doble_proposito)
    if (proposito) {
      donde.proposito = proposito;
    }

    const ganado = await Ganado.findAll({
      where: donde,
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }],
      order: [['fechaRegistro', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: ganado.length,
      data: ganado
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un animal por ID con evaluación biológica y métricas de producción lechera
// @route   GET /api/ganado/:id
// @access  Private
exports.obtenerAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }]
    });

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    // Evaluación biológica
    const pesoEval = animal.pesoActual || animal.pesoInicial;
    const evaluacionBiologica = validarRangosBiologicos({
      tipo: animal.tipo,
      fechaNacimiento: animal.fechaNacimiento,
      peso: pesoEval
    });

    // Estadísticas de producción lechera del mes
    const { inicioMes, finMes } = getRangoMesActual();
    const registrosMes = await Registro.findAll({
      where: {
        ganadoId: animal.id,
        tipo: 'leche',
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      order: [['fecha', 'DESC']]
    });

    const produccionLechera = calcularProduccionLechera(animal, registrosMes);

    const data = animal.toJSON();
    data.evaluacionBiologica = evaluacionBiologica;
    data.produccionLechera = produccionLechera;

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear un nuevo animal con validaciones biológicas
// @route   POST /api/ganado
// @access  Private
exports.crearAnimal = async (req, res) => {
  try {
    const { tipo, fechaNacimiento, pesoInicial, pesoActual } = req.body;
    const pesoParaValidar = pesoActual !== undefined && pesoActual !== null ? pesoActual : pesoInicial;

    // Validación biológica de edad vs peso
    const evalBiologica = validarRangosBiologicos({
      tipo,
      fechaNacimiento,
      peso: pesoParaValidar
    });

    if (evalBiologica.errorCritico) {
      return res.status(400).json({
        success: false,
        message: evalBiologica.advertencias.join(', ')
      });
    }

    const animal = await Ganado.create({
      ...req.body,
      responsableId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Animal registrado exitosamente',
      advertenciasBiologicas: evalBiologica.advertencias,
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar un animal con alertas biológicas y clínicas
// @route   PUT /api/ganado/:id
// @access  Private
exports.actualizarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal no encontrado' });
    }

    let datosActualizar = { ...req.body };

    // 1. Estado de salida técnico (vendido, fallecido, etc.)
    if (req.body.estado) {
      datosActualizar.estado = req.body.estado;
    }

    // 2. Alertas clínicas automáticas basadas en caída de peso
    if (req.body.pesoActual && animal.pesoInicial) {
      const pesoActualNum = parseFloat(req.body.pesoActual);
      const pesoInicialNum = parseFloat(animal.pesoInicial);

      if (pesoActualNum < pesoInicialNum * 0.9) {
        datosActualizar.estadoSalud = 'enfermo';
        datosActualizar.observaciones = `[ALERTA AUTOMÁTICA DEL BACKEND]: El animal ha bajado drásticamente de peso. Estado de salud degradado automáticamente a enfermo para revisión veterinaria urgente. ` + (req.body.observaciones || '');
      }
    }

    // 3. Validación biológica de edad vs peso
    const tipoAnimal = req.body.tipo || animal.tipo;
    const fechaNacimiento = req.body.fechaNacimiento || animal.fechaNacimiento;
    const pesoParaValidar = req.body.pesoActual !== undefined ? req.body.pesoActual : (req.body.pesoInicial !== undefined ? req.body.pesoInicial : animal.pesoActual);

    const evalBiologica = validarRangosBiologicos({
      tipo: tipoAnimal,
      fechaNacimiento,
      peso: pesoParaValidar
    });

    if (evalBiologica.errorCritico) {
      return res.status(400).json({
        success: false,
        message: evalBiologica.advertencias.join(', ')
      });
    }

    await animal.update(datosActualizar);
    await animal.reload();

    res.status(200).json({
      success: true,
      message: 'Datos del animal actualizados y evaluados por el sistema de control biológico',
      advertenciasBiologicas: evalBiologica.advertencias,
      data: animal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Eliminar un animal
// @route   DELETE /api/ganado/:id
// @access  Private
exports.eliminarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    await animal.destroy();

    res.status(200).json({
      success: true,
      message: 'Animal eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener control lechero detallado de un animal específico (Estimada vs. Real)
// @route   GET /api/ganado/:id/control-lechero
// @access  Private
exports.obtenerControlLechero = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email']
      }]
    });

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    const { inicioMes, finMes } = getRangoMesActual();

    // Obtener registros de leche del animal en el mes
    const registrosMes = await Registro.findAll({
      where: {
        ganadoId: animal.id,
        tipo: 'leche',
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      order: [['fecha', 'DESC']]
    });

    const metricas = calcularProduccionLechera(animal, registrosMes);

    res.status(200).json({
      success: true,
      data: {
        ...metricas,
        registrosMes
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener resumen global de control lechero para todo el hato
// @route   GET /api/ganado/control-lechero/resumen
// @access  Private
exports.obtenerResumenControlLechero = async (req, res) => {
  try {
    const { inicioMes, finMes } = getRangoMesActual();

    // Obtener todos los bovinos activos (o que tengan propósito lechero / doble propósito)
    const bovinos = await Ganado.findAll({
      where: {
        tipo: 'bovino',
        estado: { [Op.ne]: 'fallecido' }
      },
      order: [['identificacion', 'ASC']]
    });

    // Obtener todos los registros de leche del mes
    const registrosLecheMes = await Registro.findAll({
      where: {
        tipo: 'leche',
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      },
      include: [{
        model: Ganado,
        as: 'ganado',
        attributes: ['id', 'identificacion', 'raza', 'proposito']
      }],
      order: [['fecha', 'DESC']]
    });

    // Agrupar registros por animal
    const registrosPorAnimal = {};
    for (const reg of registrosLecheMes) {
      if (reg.ganadoId) {
        if (!registrosPorAnimal[reg.ganadoId]) {
          registrosPorAnimal[reg.ganadoId] = [];
        }
        registrosPorAnimal[reg.ganadoId].push(reg);
      }
    }

    let produccionTotalHoy = 0;
    let totalAcumuladoMes = 0;
    let sumaPromediosDiarios = 0;
    const statsPorAnimal = [];

    for (const animal of bovinos) {
      const regAnimal = registrosPorAnimal[animal.id] || [];
      const stats = calcularProduccionLechera(animal, regAnimal);
      produccionTotalHoy += stats.produccionHoy;
      totalAcumuladoMes += stats.totalMensualReal;
      sumaPromediosDiarios += stats.promedioDiarioCalculado;
      statsPorAnimal.push(stats);
    }

    const promedioDiarioHato = bovinos.length > 0 
      ? parseFloat((sumaPromediosDiarios / bovinos.length).toFixed(2)) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        produccionHoy: parseFloat(produccionTotalHoy.toFixed(2)),
        promedioDiario: promedioDiarioHato,
        totalMes: parseFloat(totalAcumuladoMes.toFixed(2)),
        totalBovinos: bovinos.length,
        bovinosConRegistros: Object.keys(registrosPorAnimal).length,
        ultimosRegistros: registrosLecheMes.slice(0, 15),
        detallesPorAnimal: statsPorAnimal
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Registrar ordeño diario para un animal específico (Guarda en la tabla registros)
// @route   POST /api/ganado/:id/ordenio
// @access  Private
exports.registrarOrdenio = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    const { cantidad, fecha, observaciones, sesion } = req.body;

    const litros = parseFloat(cantidad);
    if (isNaN(litros) || litros <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad de leche en litros debe ser un número mayor a cero'
      });
    }

    const fechaRegistro = fecha ? new Date(fecha) : new Date();
    const turnoTexto = sesion ? ` (Turno: ${sesion})` : '';

    const nuevoRegistro = await Registro.create({
      tipo: 'leche',
      categoria: 'Ordeño Diario',
      descripcion: `Ordeño diario registrado para ${animal.identificacion}${turnoTexto}`,
      fecha: fechaRegistro,
      cantidad: litros,
      unidad: 'litros',
      observaciones: observaciones || '',
      ganadoId: animal.id,
      registradoPorId: req.usuario.id
    });

    // Re-calcular estadísticas en tiempo real
    const { inicioMes, finMes } = getRangoMesActual(fechaRegistro);
    const registrosMes = await Registro.findAll({
      where: {
        ganadoId: animal.id,
        tipo: 'leche',
        fecha: {
          [Op.between]: [inicioMes, finMes]
        }
      }
    });

    const estadisticasActualizadas = calcularProduccionLechera(animal, registrosMes, fechaRegistro);

    res.status(201).json({
      success: true,
      message: 'Ordeño registrado exitosamente',
      data: nuevoRegistro,
      estadisticas: estadisticasActualizadas
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};