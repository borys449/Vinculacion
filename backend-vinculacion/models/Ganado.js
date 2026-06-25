const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ganado = sequelize.define('Ganado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  identificacion: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('bovino', 'porcino', 'ovino', 'caprino', 'avicola', 'otro'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  raza: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  sexo: {
    type: DataTypes.ENUM('macho', 'hembra'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  pesoInicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  pesoActual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  estadoSalud: {
    type: DataTypes.ENUM('excelente', 'bueno', 'regular', 'enfermo'),
    defaultValue: 'bueno'
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
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ganado',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: false
});

module.exports = Ganado;