module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('ganado');
    if (!table.foto) {
      await queryInterface.addColumn('ganado', 'foto', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('ganado');
    if (table.foto) {
      await queryInterface.removeColumn('ganado', 'foto');
    }
  },
};
