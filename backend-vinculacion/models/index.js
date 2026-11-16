const Usuario = require('./Usuario');
const Cultivo = require('./Cultivo');
const Ganado = require('./Ganado');
const Registro = require('./Registro');
const Finca = require('./Finca');
const Lote = require('./Lote');

// Relaciones Finca - Usuario
Finca.hasMany(Usuario, { foreignKey: 'fincaId', as: 'usuarios' });
Usuario.belongsTo(Finca, { foreignKey: 'fincaId', as: 'finca' });

Finca.belongsTo(Usuario, { foreignKey: 'propietarioId', as: 'propietario' });
Usuario.hasMany(Finca, { foreignKey: 'propietarioId', as: 'fincasPropiedad' });

// Relaciones Finca - Lotes
Finca.hasMany(Lote, { foreignKey: 'fincaId', as: 'lotes' });
Lote.belongsTo(Finca, { foreignKey: 'fincaId', as: 'finca' });

// Relaciones Usuario - Lotes (autoría de lotes)
Usuario.hasMany(Lote, { foreignKey: 'creadoPorId', as: 'lotesCreados' });
Lote.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });

// Relaciones Lote - Cultivo (amarrado obligatorio)
Lote.hasMany(Cultivo, { foreignKey: 'loteId', as: 'cultivos' });
Cultivo.belongsTo(Lote, { foreignKey: 'loteId', as: 'lote' });

// Relaciones Lote - Ganado (amarrado obligatorio)
Lote.hasMany(Ganado, { foreignKey: 'loteId', as: 'ganado' });
Ganado.belongsTo(Lote, { foreignKey: 'loteId', as: 'lote' });

// Relaciones Finca - Cultivos / Ganado / Registros (Multi-tenancy)
Finca.hasMany(Cultivo, { foreignKey: 'fincaId', as: 'cultivos' });
Cultivo.belongsTo(Finca, { foreignKey: 'fincaId', as: 'finca' });

Finca.hasMany(Ganado, { foreignKey: 'fincaId', as: 'ganados' });
Ganado.belongsTo(Finca, { foreignKey: 'fincaId', as: 'finca' });

Finca.hasMany(Registro, { foreignKey: 'fincaId', as: 'registros' });
Registro.belongsTo(Finca, { foreignKey: 'fincaId', as: 'finca' });

// Relaciones Usuario -> Cultivos / Ganado / Registros
Usuario.hasMany(Cultivo, { foreignKey: 'responsableId', as: 'cultivos' });
Cultivo.belongsTo(Usuario, { foreignKey: 'responsableId', as: 'responsable' });

Usuario.hasMany(Ganado, { foreignKey: 'responsableId', as: 'ganado' });
Ganado.belongsTo(Usuario, { foreignKey: 'responsableId', as: 'responsable' });

Usuario.hasMany(Registro, { foreignKey: 'registradoPorId', as: 'registros' });
Registro.belongsTo(Usuario, { foreignKey: 'registradoPorId', as: 'registradoPor' });

// Cultivo -> Registros
Cultivo.hasMany(Registro, { foreignKey: 'cultivoId', as: 'registros' });
Registro.belongsTo(Cultivo, { foreignKey: 'cultivoId', as: 'cultivo' });

// Ganado -> Registros
Ganado.hasMany(Registro, { foreignKey: 'ganadoId', as: 'registros' });
Registro.belongsTo(Ganado, { foreignKey: 'ganadoId', as: 'ganado' });

// Lote -> Registros (Bitácora de acciones sobre lotes)
Lote.hasMany(Registro, { foreignKey: 'loteId', as: 'registros' });
Registro.belongsTo(Lote, { foreignKey: 'loteId', as: 'lote' });

module.exports = {
  Usuario,
  Cultivo,
  Ganado,
  Registro,
  Finca,
  Lote
};
