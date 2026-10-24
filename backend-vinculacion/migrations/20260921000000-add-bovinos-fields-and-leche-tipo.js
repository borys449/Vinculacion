const { sequelize } = require('../config/database');
require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Sync database so tables exist
    await sequelize.sync({ alter: false });

    // 2. Check and add columns to 'ganado' table
    const tableInfoGanado = await queryInterface.describeTable('ganado');

    if (!tableInfoGanado.proposito) {
      await queryInterface.addColumn('ganado', 'proposito', {
        type: Sequelize.ENUM('leche', 'carne', 'doble_proposito'),
        allowNull: true
      });
    }

    if (!tableInfoGanado.produccionEstimadaDiaria) {
      await queryInterface.addColumn('ganado', 'produccionEstimadaDiaria', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0
      });
    }

    // 3. Make 'raza' allowNull: true if needed
    if (tableInfoGanado.raza && !tableInfoGanado.raza.allowNull) {
      await queryInterface.changeColumn('ganado', 'raza', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    // 4. In 'registros' table, extend ENUM 'tipo' to include 'leche' for PostgreSQL
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_registros_tipo') THEN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumtypid = 'enum_registros_tipo'::regtype 
              AND enumlabel = 'leche'
            ) THEN
              ALTER TYPE "enum_registros_tipo" ADD VALUE 'leche';
            END IF;
          END IF;
        END$$;
      `);
    } catch (enumErr) {
      console.warn('[Migration] Note on enum_registros_tipo:', enumErr.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfoGanado = await queryInterface.describeTable('ganado');
    if (tableInfoGanado.proposito) {
      await queryInterface.removeColumn('ganado', 'proposito');
    }
    if (tableInfoGanado.produccionEstimadaDiaria) {
      await queryInterface.removeColumn('ganado', 'produccionEstimadaDiaria');
    }
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ganado_proposito";');
  }
};
