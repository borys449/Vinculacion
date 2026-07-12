const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ override: true });

let dbName = process.env.DB_NAME || 'finca_lodana';
let dbUser = process.env.DB_USER || 'postgres';
let dbPassword = process.env.DB_PASSWORD || '';
let dbHost = process.env.DB_HOST || '127.0.0.1';
let dbPort = Number(process.env.DB_PORT || 5432);

// Buscar variables de entorno inyectadas por .NET Aspire u otros orquestadores
let connectionString = null;
for (const key in process.env) {
  if (key.toLowerCase().startsWith('connectionstrings__') || key.toLowerCase() === 'connectionstring') {
    connectionString = process.env[key];
    console.log(`[Database] Detectada cadena de conexión en la variable de entorno: ${key}`);
    break;
  }
}

let sequelize;

if (connectionString) {
  if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
    console.log('[Database] Usando cadena de conexión en formato URI.');
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    console.log('[Database] Usando cadena de conexión en formato clave=valor (ADO.NET).');
    const params = {};
    connectionString.split(';').forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx !== -1) {
        const key = pair.substring(0, idx).trim().toLowerCase();
        const val = pair.substring(idx + 1).trim();
        params[key] = val;
      }
    });

    dbHost = params.host || params.server || dbHost;
    dbPort = Number(params.port || dbPort);
    dbName = params.database || params.db || dbName;
    dbUser = params.username || params.user || params['user id'] || dbUser;
    dbPassword = params.password || params.pwd || dbPassword;

    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }
} else {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

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