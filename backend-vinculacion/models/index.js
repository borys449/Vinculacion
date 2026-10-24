const Usuario = require('./Usuario');
const Cultivo = require('./Cultivo');
const Ganado = require('./Ganado');
const Registro = require('./Registro');

// Definir relaciones

// Usuario -> Cultivos (uno a muchos)
Usuario.hasMany(Cultivo, { foreignKey: 'responsableId', as: 'cultivos' });
Cultivo.belongsTo(Usuario, { foreignKey: 'responsableId', as: 'responsable' });

// Usuario -> Ganado (uno a muchos)
Usuario.hasMany(Ganado, { foreignKey: 'responsableId', as: 'ganado' });
Ganado.belongsTo(Usuario, { foreignKey: 'responsableId', as: 'responsable' });

// Usuario -> Registros (uno a muchos)
Usuario.hasMany(Registro, { foreignKey: 'registradoPorId', as: 'registros' });
Registro.belongsTo(Usuario, { foreignKey: 'registradoPorId', as: 'registradoPor' });

// Cultivo -> Registros (uno a muchos)
Cultivo.hasMany(Registro, { foreignKey: 'cultivoId', as: 'registros' });
Registro.belongsTo(Cultivo, { foreignKey: 'cultivoId', as: 'cultivo' });

// Ganado -> Registros (uno a muchos)
Ganado.hasMany(Registro, { foreignKey: 'ganadoId', as: 'registros' });
Registro.belongsTo(Ganado, { foreignKey: 'ganadoId', as: 'ganado' });

module.exports = {
  Usuario,
  Cultivo,
  Ganado,
  Registro
};

