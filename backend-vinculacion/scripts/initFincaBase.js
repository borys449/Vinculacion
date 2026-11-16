require('dotenv').config({ override: true });
const { sequelize } = require('../config/database');
const db = require('../models');
const bcrypt = require('bcrypt');

const POLIGONO_LODANA = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-80.3894, -1.1585], [-80.3883, -1.1582], [-80.3873, -1.1585],
      [-80.3869, -1.1602], [-80.3880, -1.1620], [-80.3887, -1.1617],
      [-80.3896, -1.1636], [-80.3907, -1.1636], [-80.3907, -1.1606],
      [-80.3891, -1.1600], [-80.3894, -1.1585]
    ]]
  }
};

async function initFincaBase() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL autenticado.');

    // Sincronizar modelos (crea fincas y lotes si no existen)
    await db.Finca.sync();
    await db.Lote.sync();
    await db.Usuario.sync();
    await db.Cultivo.sync();
    await db.Ganado.sync();
    await db.Registro.sync();

    const queryInterface = sequelize.getQueryInterface();

    // Asegurar columnas en usuarios
    const userCols = await queryInterface.describeTable('usuarios');
    if (!userCols.fincaId) {
      await queryInterface.addColumn('usuarios', 'fincaId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fincas', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('Columna fincaId añadida a usuarios');
    }

    // Asegurar columnas en cultivos
    const cultivoCols = await queryInterface.describeTable('cultivos');
    if (!cultivoCols.fincaId) {
      await queryInterface.addColumn('cultivos', 'fincaId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fincas', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
    if (!cultivoCols.loteId) {
      await queryInterface.addColumn('cultivos', 'loteId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'lotes', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }

    // Asegurar columnas en ganado
    const ganadoCols = await queryInterface.describeTable('ganado');
    if (!ganadoCols.fincaId) {
      await queryInterface.addColumn('ganado', 'fincaId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fincas', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
    if (!ganadoCols.loteId) {
      await queryInterface.addColumn('ganado', 'loteId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'lotes', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }

    // Asegurar columnas en registros
    const regCols = await queryInterface.describeTable('registros');
    if (!regCols.fincaId) {
      await queryInterface.addColumn('registros', 'fincaId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'fincas', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
    if (!regCols.loteId) {
      await queryInterface.addColumn('registros', 'loteId', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'lotes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }

    // 1. Obtener o crear la Finca Lodana
    let fincaLodana = await db.Finca.findOne({ where: { nombre: 'Finca Lodana' } });
    if (!fincaLodana) {
      fincaLodana = await db.Finca.create({
        nombre: 'Finca Lodana',
        poligonoPerimetro: POLIGONO_LODANA
      });
      console.log('Finca Lodana creada con ID:', fincaLodana.id);
    } else {
      await fincaLodana.update({ poligonoPerimetro: POLIGONO_LODANA });
      console.log('Finca Lodana actualizada con su polígono base.');
    }

    // 2. Crear o actualizar usuarios de prueba y vincularlos a Finca Lodana
    const usuariosPrueba = [
      {
        nombre: process.env.ADMIN_NOMBRE || 'Lionel Messi',
        cedula: process.env.ADMIN_CEDULA || '1317988325',
        email: process.env.ADMIN_EMAIL || 'yosoysupermantlj@gmail.com',
        telefono: process.env.ADMIN_TELEFONO || '0987654321',
        area: 'administracion',
        tipo: 'administrador',
        passwordPlana: process.env.ADMIN_PASSWORD || 'Lio2026'
      },
      {
        nombre: process.env.CULTIVOS_NOMBRE || 'Elkin Cantos',
        cedula: process.env.CULTIVOS_CEDULA || '1315401917',
        email: process.env.CULTIVOS_EMAIL || 'yosoyironmantlj@gmail.com',
        telefono: process.env.CULTIVOS_TELEFONO || '0999923456',
        area: 'cultivos',
        tipo: 'trabajador',
        passwordPlana: process.env.CULTIVOS_PASSWORD || 'Yosoyironmantlj2000'
      },
      {
        nombre: process.env.GANADERIA_NOMBRE || 'Loretta',
        cedula: process.env.GANADERIA_CEDULA || '1351798812',
        email: process.env.GANADERIA_EMAIL || 'yosoybatmantlj@gmail.com',
        telefono: process.env.GANADERIA_TELEFONO || '0123456789',
        area: 'ganaderia',
        tipo: 'trabajador',
        passwordPlana: process.env.GANADERIA_PASSWORD || 'Loretta2026'
      }
    ];

    let adminUser = null;
    for (const u of usuariosPrueba) {
      let usuario = await db.Usuario.findOne({ where: { email: u.email } });
      if (!usuario) {
        const hashedPassword = await bcrypt.hash(u.passwordPlana, 10);
        usuario = await db.Usuario.create({
          nombre: u.nombre,
          cedula: u.cedula,
          email: u.email,
          telefono: u.telefono,
          area: u.area,
          tipo: u.tipo,
          password: hashedPassword,
          activo: true,
          fincaId: fincaLodana.id
        });
        console.log(`Usuario creado y vinculado: ${u.nombre} (${u.email}) -> Finca ${fincaLodana.id}`);
      } else {
        await usuario.update({ fincaId: fincaLodana.id });
        console.log(`Usuario vinculado a finca: ${usuario.nombre} -> Finca ${fincaLodana.id}`);
      }
      if (u.tipo === 'administrador') {
        adminUser = usuario;
      }
    }

    if (adminUser) {
      await fincaLodana.update({ propietarioId: adminUser.id });
    }

    // 3. Crear lotes iniciales de prueba para agricultura y ganadería si no existen
    let loteAgricola = await db.Lote.findOne({ where: { fincaId: fincaLodana.id, tipo: 'agricultura' } });
    if (!loteAgricola) {
      loteAgricola = await db.Lote.create({
        nombre: 'Lote Agrícola Lodana 1',
        tipo: 'agricultura',
        geometria: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-80.3894, -1.1585], [-80.3883, -1.1582], [-80.3873, -1.1585],
              [-80.3880, -1.1600], [-80.3891, -1.1600], [-80.3894, -1.1585]
            ]]
          }
        },
        fincaId: fincaLodana.id,
        creadoPorId: adminUser ? adminUser.id : 1
      });
      console.log('Lote Agrícola 1 creado.');
    }

    let loteGanadero = await db.Lote.findOne({ where: { fincaId: fincaLodana.id, tipo: 'ganaderia' } });
    if (!loteGanadero) {
      loteGanadero = await db.Lote.create({
        nombre: 'Lote Ganadero Lodana 1',
        tipo: 'ganaderia',
        geometria: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-80.3880, -1.1600], [-80.3869, -1.1602], [-80.3880, -1.1620],
              [-80.3887, -1.1617], [-80.3891, -1.1600], [-80.3880, -1.1600]
            ]]
          }
        },
        fincaId: fincaLodana.id,
        creadoPorId: adminUser ? adminUser.id : 1
      });
      console.log('Lote Ganadero 1 creado.');
    }

    // 4. Asignar fincaId y loteId a cultivos existentes que no tengan asignación
    await db.Cultivo.update(
      { fincaId: fincaLodana.id, loteId: loteAgricola.id },
      { where: { fincaId: null } }
    );
    await db.Cultivo.update(
      { loteId: loteAgricola.id },
      { where: { loteId: null } }
    );

    // 5. Asignar fincaId y loteId a animales existentes que no tengan asignación
    await db.Ganado.update(
      { fincaId: fincaLodana.id, loteId: loteGanadero.id },
      { where: { fincaId: null } }
    );
    await db.Ganado.update(
      { loteId: loteGanadero.id },
      { where: { loteId: null } }
    );

    // 6. Asignar fincaId a registros existentes
    await db.Registro.update(
      { fincaId: fincaLodana.id },
      { where: { fincaId: null } }
    );

    console.log('Inicialización de Finca Base Lodana completada con éxito.');
  } catch (err) {
    console.error('Error inicializando Finca Base:', err);
  }
}

if (require.main === module) {
  initFincaBase().then(() => process.exit(0));
}

module.exports = { initFincaBase, POLIGONO_LODANA };
