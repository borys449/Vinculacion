'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await queryInterface.bulkInsert(
      'usuarios',
      [
        {
          nombre: 'Administrador',
          cedula: '0000000000',
          telefono: '0999999999',
          area: 'administracion',
          email: 'admin@admin.com',
          password: hashedPassword,
          tipo: 'administrador',
          activo: true,
          fechaRegistro: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'usuarios',
      { email: 'admin@admin.com' },
      {}
    );
  },
};
