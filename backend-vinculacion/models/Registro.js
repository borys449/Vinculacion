const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registro = sequelize.define('Registro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('cultivo', 'ganado', 'mantenimiento', 'produccion', 'venta', 'otro'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  unidad: {
    type: DataTypes.ENUM('kg', 'toneladas', 'litros', 'unidades', 'metros', 'hectareas', 'otro'),
    allowNull: true
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  ingresos: {
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
  cultivoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cultivos',
      key: 'id'
    }
  },
  ganadoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ganado',
      key: 'id'
    }
  },
  registradoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'registros',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: false
});

module.exports = Registro;