const { Cultivo, Usuario, Registro } = require('../models');
const { Op } = require('sequelize');

exports.obtenerCultivos = async (req, res) => {
  try {
    const { search } = req.query;
    let donde = {};

    if (search) {
      donde[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { ubicacion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const cultivos = await Cultivo.findAll({
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
      count: cultivos.length,
      data: cultivos
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.obtenerCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'nombre', 'email', 'area']
      }]
    });

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.crearCultivo = async (req, res) => {
  try {
    let datosCultivo = { ...req.body };

    if (!datosCultivo.fechaCosechaEstimada && datosCultivo.fechaSiembra) {
      const fechaSiembra = new Date(datosCultivo.fechaSiembra);
      let mesesMaduracion = 3;
      if (datosCultivo.tipo === 'frutal') mesesMaduracion = 12;
      if (datosCultivo.tipo === 'cereal') mesesMaduracion = 6;
      if (datosCultivo.tipo === 'leguminosa') mesesMaduracion = 4;

      fechaSiembra.setMonth(fechaSiembra.getMonth() + mesesMaduracion);
      datosCultivo.fechaCosechaEstimada = fechaSiembra.toISOString().split('T')[0];
      datosCultivo.observaciones = `[CÓMPUTO AUTOMÁTICO]: Fecha de cosecha estimada proyectada a ${mesesMaduracion} meses. ` + (datosCultivo.observaciones || '');
    }

    const cultivo = await Cultivo.create({
      ...datosCultivo,
      responsableId: req.usuario.id
    });

    await Registro.create({
      tipo: 'cultivo',
      categoria: 'Creación de Cultivo',
      descripcion: `Se creó el cultivo de ${cultivo.nombre} (${cultivo.tipo})`,
      fecha: new Date(),
      cultivoId: cultivo.id,
      registradoPorId: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Cultivo registrado y proyectado cronológicamente con éxito',
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.actualizarCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    // 🚀 Detección dinámica general de cambios en cultivos
    let cambiosCultivo = [];
    const camposPermitidosCultivo = [
      'nombre', 'tipo', 'variedad', 'areaHectareas', 'ubicacion', 
      'estado', 'fechaSiembra', 'fechaCosechaEstimada', 'observaciones'
    ];

    camposPermitidosCultivo.forEach(campo => {
      if (req.body[campo] !== undefined && req.body[campo] !== null) {
        const valorAntiguo = cultivo[campo] !== null ? String(cultivo[campo]) : '';
        const valorNuevo = String(req.body[campo]);

        if (valorAntiguo !== valorNuevo) {
          cambiosCultivo.push(`${campo}: '${valorNuevo}'`);
        }
      }
    });

    await cultivo.update(req.body);
    await cultivo.reload();

    const detalleCultivo = cambiosCultivo.length > 0 
      ? `Actualizó: ${cambiosCultivo.join(', ')}` 
      : 'Se actualizó información general del cultivo';

    await Registro.create({
      tipo: 'cultivo',
      categoria: 'Actualización',
      descripcion: `Cultivo ${cultivo.nombre}: ${detalleCultivo}`,
      fecha: new Date(),
      cultivoId: cultivo.id,
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Cultivo actualizado exitosamente',
      data: cultivo
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.eliminarCultivo = async (req, res) => {
  try {
    const cultivo = await Cultivo.findByPk(req.params.id);

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    const nombreCultivo = cultivo.nombre;
    await cultivo.destroy();

    await Registro.create({
      tipo: 'cultivo',
      categoria: 'Eliminación',
      descripcion: `Se eliminó el cultivo ${nombreCultivo}`,
      fecha: new Date(),
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Cultivo eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};