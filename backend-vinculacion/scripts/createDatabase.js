const { Client } = require('pg');
require('dotenv').config({ override: true });

const databaseName = process.env.DB_NAME || 'finca_lodana';
const databaseUser = process.env.DB_USER || 'postgres';
const databasePassword = process.env.DB_PASSWORD || '';
const databaseHost = process.env.DB_HOST || 'localhost';
const databasePort = Number(process.env.DB_PORT || 5432);

const client = new Client({
  host: databaseHost,
  port: databasePort,
  user: databaseUser,
  password: databasePassword,
  database: 'postgres',
});

async function createDatabase() {
  await client.connect();

  try {
    const safeDatabaseName = databaseName.replace(/"/g, '""');
    await client.query(`CREATE DATABASE "${safeDatabaseName}"`);
    console.log(`Base de datos ${databaseName} creada correctamente.`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`La base de datos ${databaseName} ya existe.`);
      return;
    }

    throw error;
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error('Error creando la base de datos:', error.message);
  process.exit(1);
});