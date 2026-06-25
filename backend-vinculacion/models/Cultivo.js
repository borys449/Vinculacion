const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cultivo = sequelize.define('Cultivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('vegetal', 'frutal', 'cereal', 'hortaliza', 'leguminosa', 'otro'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notEmpty: true
    }
  },
  unidad: {
    type: DataTypes.ENUM('metros', 'hectareas'),
    allowNull: false,
    defaultValue: 'hectareas'
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fechaSiembra: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fechaCosechaEstimada: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('siembra', 'crecimiento', 'floracion', 'cosecha', 'completado'),
    defaultValue: 'siembra'
  },
  rendimiento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsableId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'cultivos',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: false
});

module.exports = Cultivo;