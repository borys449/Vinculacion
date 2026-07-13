const { Ganado, Usuario } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todo el ganado (Soporta filtros por búsqueda, estado y tipo)
// @route   GET /api/ganado
// @access  Private
exports.obtenerGanado = async (req, res) => {
  try {
    const { search, estado, tipo } = req.query;
    let donde = {};

    // 1. Barra de Búsqueda: Filtra por identificación o raza (insensible a mayúsculas/minúsculas)
    if (search) {
      donde[Op.or] = [
        { identificacion: { [Op.iLike]: `%${search}%` } },
        { raza: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 2. Filtro por Estado de Gestión (CORREGIDO: Ya no bloquea los datos en consultas generales)
    if (estado && estado !== 'todos') {
      donde.estado = estado;
    } 

    // 3. Filtro por Tipo de Animal (bovino, porcino, etc.)
    if (tipo) {
      donde.tipo = tipo;
    }

    const ganado = await Ganado.findAll({
      where: donde, // Ahora sí aplica dinámicamente todo el objeto de filtros sin exclusiones fijas
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

// @desc    Obtener un animal por ID
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

    res.status(200).json({
      success: true,
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear un nuevo animal
// @route   POST /api/ganado
// @access  Private
exports.crearAnimal = async (req, res) => {
  try {
    const animal = await Ganado.create({
      ...req.body,
      responsableId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Animal registrado exitosamente',
      data: animal
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar un animal (Une alertas clínicas automáticas y cambios de estado: vendido/fallecido)
// @route   PUT /api/ganado/:id
// @access  Private
exports.actualizarAnimal = async (req, res) => {
  try {
    const animal = await Ganado.findByPk(req.params.id);

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal no encontrado' });
    }

    let datosActualizar = { ...req.body };

    // 1. LÓGICA DE TU AMIGO: Si se envía un estado de salida técnico (vendido, fallecido), se asume en datosActualizar
    if (req.body.estado) {
      datosActualizar.estado = req.body.estado;
    }

    // 2. TU LÓGICA CLÍNICA: Automatización de alertas clínicas basadas en pesaje técnico
    if (req.body.pesoActual && animal.pesoInicial) {
      const pesoActualNum = parseFloat(req.body.pesoActual);
      const pesoInicialNum = parseFloat(animal.pesoInicial);

      // Si el animal perdió más del 10% de su peso inicial, acción clínica autónoma
      if (pesoActualNum < pesoInicialNum * 0.9) {
        datosActualizar.estadoSalud = 'enfermo';
        datosActualizar.observaciones = `[ALERTA AUTOMÁTICA DEL BACKEND]: El animal ha bajado drásticamente de peso. Estado de salud degradado automáticamente a enfermo para revisión veterinaria urgente. ` + (req.body.observaciones || '');
      }
    }

    await animal.update(datosActualizar);
    await animal.reload();

    res.status(200).json({
      success: true,
      message: 'Datos del animal actualizados y evaluados por el sistema de control biológico',
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