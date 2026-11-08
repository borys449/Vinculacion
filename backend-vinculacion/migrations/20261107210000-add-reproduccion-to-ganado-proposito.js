module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ganado_proposito') THEN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumtypid = 'enum_ganado_proposito'::regtype 
              AND enumlabel = 'reproduccion'
            ) THEN
              ALTER TYPE "enum_ganado_proposito" ADD VALUE 'reproduccion';
            END IF;
          END IF;
        END$$;
      `);
    } catch (enumErr) {
      console.warn('[Migration] Note on enum_ganado_proposito:', enumErr.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL no permite eliminar valores individuales de un ENUM fácilmente sin recrearlo
  }
};
