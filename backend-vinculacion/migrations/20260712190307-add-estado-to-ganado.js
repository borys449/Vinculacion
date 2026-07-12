'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ganado', 'estado', {
      type: Sequelize.ENUM('activo', 'inactivo', 'vendido', 'enfermo', 'gestacion', 'fallecido'),
      defaultValue: 'activo',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ganado', 'estado');
    // Opcional: Eliminar el tipo ENUM en Postgres si se hace rollback
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ganado_estado";');
  }
};
