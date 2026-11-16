const { Cultivo, Usuario, Registro, Lote } = require('../models');
const { Op } = require('sequelize');

exports.obtenerCultivos = async (req, res) => {
  try {
    const { search } = req.query;
    let donde = {};

    if (req.usuario && req.usuario.fincaId) {
      donde.fincaId = req.usuario.fincaId;
    }

    if (search) {
      donde[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { ubicacion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const cultivos = await Cultivo.findAll({
      where: donde,
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'nombre', 'email', 'area']
        },
        {
          model: Lote,
          as: 'lote',
          attributes: ['id', 'nombre', 'tipo']
        }
      ],
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
    let donde = { id: req.params.id };
    if (req.usuario && req.usuario.fincaId) {
      donde.fincaId = req.usuario.fincaId;
    }

    const cultivo = await Cultivo.findOne({
      where: donde,
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'nombre', 'email', 'area']
        },
        {
          model: Lote,
          as: 'lote',
          attributes: ['id', 'nombre', 'tipo']
        }
      ]
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

    // Regla de negocio estricta: Cultivo amarrado obligatoriamente a un loteId existente
    if (!datosCultivo.loteId) {
      return res.status(400).json({
        success: false,
        message: 'Orden estricto: Debe seleccionar obligatoriamente un lote agrícola existente.'
      });
    }

    const lote = await Lote.findOne({
      where: {
        id: datosCultivo.loteId,
        ...(req.usuario && req.usuario.fincaId ? { fincaId: req.usuario.fincaId } : {}),
        tipo: 'agricultura'
      }
    });

    if (!lote) {
      return res.status(400).json({
        success: false,
        message: 'El lote seleccionado no existe en su finca o no pertenece a la rama agrícola.'
      });
    }

    if (!datosCultivo.ubicacion) {
      datosCultivo.ubicacion = lote.nombre;
    }

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
      fincaId: req.usuario ? req.usuario.fincaId : lote.fincaId,
      loteId: lote.id,
      responsableId: req.usuario.id
    });

    await Registro.create({
      tipo: 'cultivo',
      categoria: 'Creación de Cultivo',
      descripcion: `Se creó el cultivo de ${cultivo.nombre} (${cultivo.tipo}) en el lote ${lote.nombre}`,
      fecha: new Date(),
      cultivoId: cultivo.id,
      fincaId: req.usuario ? req.usuario.fincaId : null,
      loteId: lote.id,
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
    let donde = { id: req.params.id };
    if (req.usuario && req.usuario.fincaId) {
      donde.fincaId = req.usuario.fincaId;
    }

    const cultivo = await Cultivo.findOne({ where: donde });

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    if (req.body.loteId && req.body.loteId !== cultivo.loteId) {
      const lote = await Lote.findOne({
        where: {
          id: req.body.loteId,
          ...(req.usuario && req.usuario.fincaId ? { fincaId: req.usuario.fincaId } : {}),
          tipo: 'agricultura'
        }
      });
      if (!lote) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo lote seleccionado no existe o no es de tipo agricultura.'
        });
      }
    }

    let cambiosCultivo = [];
    const camposPermitidosCultivo = [
      'nombre', 'tipo', 'variedad', 'areaHectareas', 'ubicacion', 
      'estado', 'fechaSiembra', 'fechaCosechaEstimada', 'observaciones', 'loteId'
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
      fincaId: cultivo.fincaId,
      loteId: cultivo.loteId,
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
    let donde = { id: req.params.id };
    if (req.usuario && req.usuario.fincaId) {
      donde.fincaId = req.usuario.fincaId;
    }

    const cultivo = await Cultivo.findOne({ where: donde });

    if (!cultivo) {
      return res.status(404).json({
        success: false,
        message: 'Cultivo no encontrado'
      });
    }

    const nombreCultivo = cultivo.nombre;
    const fincaId = cultivo.fincaId;
    await cultivo.destroy();

    await Registro.create({
      tipo: 'cultivo',
      categoria: 'Eliminación',
      descripcion: `Se eliminó el cultivo ${nombreCultivo}`,
      fecha: new Date(),
      fincaId: fincaId,
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
