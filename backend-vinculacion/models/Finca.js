const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Finca = sequelize.define('Finca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Finca Lodana'
  },
  poligonoPerimetro: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  propietarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'fincas',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: 'fechaActualizacion'
});

module.exports = Finca;
