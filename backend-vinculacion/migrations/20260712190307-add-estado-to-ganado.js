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
        type: Sequelize.ENUM('activo', 'inactivo', 'vendido', 'enfermo', 'gestacion', 'fallecido'),
        defaultValue: 'activo',
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('ganado');
    if (tableInfo.estado) {
      await queryInterface.removeColumn('ganado', 'estado');
    }
    // Opcional: Eliminar el tipo ENUM en Postgres si se hace rollback
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ganado_estado";');
  }
};
