const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lote = sequelize.define('Lote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('agricultura', 'ganaderia'),
    allowNull: false
  },
  geometria: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  fincaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'fincas',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'lotes',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: 'fechaActualizacion'
});

module.exports = Lote;
