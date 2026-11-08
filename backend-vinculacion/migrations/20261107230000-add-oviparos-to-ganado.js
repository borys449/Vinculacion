module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ganado_tipo') THEN
          ALTER TYPE "enum_ganado_tipo" ADD VALUE IF NOT EXISTS 'oviparo';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ganado_proposito') THEN
          ALTER TYPE "enum_ganado_proposito" ADD VALUE IF NOT EXISTS 'huevos';
        END IF;
      END$$;
    `);

    const table = await queryInterface.describeTable('ganado');
    if (!table.especie) {
      await queryInterface.addColumn('ganado', 'especie', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('ganado');
    if (table.especie) {
      await queryInterface.removeColumn('ganado', 'especie');
    }
  },
};
