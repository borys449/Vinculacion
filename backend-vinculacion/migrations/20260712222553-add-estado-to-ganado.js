'use strict';
const { sequelize } = require('../config/database');
require('../models'); // Load models to ensure sync knows about them

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Sync database (creates all tables if they don't exist yet)
    await sequelize.sync({ alter: false });

    // 2. Check if table 'ganado' already has the 'estado' column
    const tableInfo = await queryInterface.describeTable('ganado');
    if (!tableInfo.estado) {
      await queryInterface.addColumn('ganado', 'estado', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'disponible',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('ganado');
    if (tableInfo.estado) {
      await queryInterface.removeColumn('ganado', 'estado');
    }
  }
};