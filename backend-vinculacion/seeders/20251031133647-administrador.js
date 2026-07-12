import dotenv from 'dotenv';
dotenv.config();

'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.admin_password, salt);

    await queryInterface.bulkInsert(
      'usuarios',
      [
        {
          nombre: process.env.admin_name,
          cedula: '0000000000',
          telefono: '0999999999',
          area: 'administracion',
          email: process.env.admin_email,
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
      { email: process.env.admin_email },
      {}
    );
  },
};
