const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'agroindustria',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para conectar y sincronizar
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida correctamente.');
    
    // Sincronizar modelos (crea las tablas si no existen)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('Modelos sincronizados con la base de datos.');
    }
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error.message);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    console.warn('Continuando sin conexión a PostgreSQL en entorno de desarrollo.');
  }
};

module.exports = { sequelize, connectDB };