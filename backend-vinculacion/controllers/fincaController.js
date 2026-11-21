const { Finca, Usuario, Lote, Registro, Cultivo, Ganado } = require('../models');

// @desc    Obtener datos de la finca del usuario autenticado
// @route   GET /api/fincas/mi-finca
// @access  Private
exports.obtenerMiFinca = async (req, res) => {
  try {
    if (!req.usuario.fincaId) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no está asignado a ninguna finca'
      });
    }

    const finca = await Finca.findByPk(req.usuario.fincaId, {
      include: [
        {
          model: Usuario,
          as: 'propietario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Lote,
          as: 'lotes',
          include: [
            {
              model: Cultivo,
              as: 'cultivos',
              attributes: ['id', 'nombre', 'tipo', 'area', 'unidad', 'estado']
            },
            {
              model: Ganado,
              as: 'ganado',
              attributes: ['id', 'identificacion', 'tipo', 'raza', 'especie', 'proposito']
            }
          ]
        }
      ]
    });

    if (!finca) {
      return res.status(404).json({
        success: false,
        message: 'Finca no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: finca
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar el perímetro GeoJSON de la finca (Exclusivo Administrador)
// @route   PUT /api/fincas/mi-finca/perimetro
// @access  Private/Admin
exports.actualizarPerimetro = async (req, res) => {
  try {
    if (req.usuario.tipo !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo el Administrador tiene autorización para modificar el perímetro general de la finca.'
      });
    }

    const { poligonoPerimetro, nombre } = req.body;

    if (!poligonoPerimetro) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar la geometría del polígono GeoJSON'
      });
    }

    const finca = await Finca.findByPk(req.usuario.fincaId);
    if (!finca) {
      return res.status(404).json({
        success: false,
        message: 'Finca no encontrada'
      });
    }

    await finca.update({
      poligonoPerimetro,
      ...(nombre ? { nombre } : {})
    });

    // Registrar en la bitácora
    await Registro.create({
      tipo: 'mantenimiento',
      categoria: 'Actualización de Perímetro',
      descripcion: `El administrador ${req.usuario.nombre} actualizó el perímetro general de la finca '${finca.nombre}'.`,
      fecha: new Date(),
      fincaId: finca.id,
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Perímetro general de la finca actualizado con éxito',
      data: finca
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar mapa completo de la finca (perímetro y todos los lotes) para empezar desde 0
// @route   DELETE /api/fincas/mi-finca/mapa
// @access  Private/Admin
exports.eliminarMapaCompleto = async (req, res) => {
  try {
    if (req.usuario.tipo !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo el Administrador tiene autorización para reiniciar el mapa de la finca.'
      });
    }

    const finca = await Finca.findByPk(req.usuario.fincaId);
    if (!finca) {
      return res.status(404).json({
        success: false,
        message: 'Finca no encontrada'
      });
    }

    // 1. Obtener y desvincular lotes existentes
    const lotes = await Lote.findAll({ where: { fincaId: finca.id } });
    const loteIds = lotes.map((l) => l.id);

    if (loteIds.length > 0) {
      await Cultivo.update({ loteId: null }, { where: { loteId: loteIds } });
      await Ganado.update({ loteId: null }, { where: { loteId: loteIds } });
      await Lote.destroy({ where: { fincaId: finca.id } });
    }

    // 2. Limpiar el perímetro de la finca
    await finca.update({ poligonoPerimetro: null });

    // 3. Registrar en bitácora
    await Registro.create({
      tipo: 'mantenimiento',
      categoria: 'Reinicio de Mapa',
      descripcion: `El administrador ${req.usuario.nombre} eliminó el mapa completo (perímetro y ${loteIds.length} lotes) de la finca '${finca.nombre}' para empezar desde cero.`,
      fecha: new Date(),
      fincaId: finca.id,
      registradoPorId: req.usuario.id
    });

    res.status(200).json({
      success: true,
      message: 'Mapa completo y lotes eliminados con éxito. Ahora puedes trazar desde cero.',
      data: finca
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
