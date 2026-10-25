require('./otel');

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser'); 
const { connectDB } = require('./config/database');
const { assertJwtSecretConfigured } = require('./config/jwt');

const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');

// Cargar variables de entorno
dotenv.config({ override: true });

// Inicializar la aplicación Express
const app = express(); 

// Configuración de middlewares globales
app.use(cookieParser()); 
app.use(helmet());

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configuración de CORS con origen específico
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate Limiting - Limitar peticiones por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde',
});
app.use('/api/', limiter);

// Rate Limiting específico para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: 'Demasiados intentos de login, por favor intente más tarde',
});
app.use('/api/auth/login', loginLimiter);

// Middleware para parsear JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cargar modelos para establecer relaciones
const db = require('./models');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/cultivos', require('./routes/cultivos'));
app.use('/api/ganado', require('./routes/ganado'));
app.use('/api/registros', require('./routes/registros'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API Finca LODANA - Sistema de Gestión Agropecuaria',
    version: '2.0.0',
    database: 'PostgreSQL',
  });
});

// Manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Levantar el servidor solo si no estamos en entorno de pruebas y si es el archivo principal
if (process.env.NODE_ENV !== 'test') {
  if (require.main === module) {
    assertJwtSecretConfigured();
    connectDB();

    app.listen(PORT, async () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);

      // 🚀 VERIFICACIÓN E INYECCIÓN AUTOMÁTICA DE LA COLUMNA "estado"
      try {
        const sequelizeInstance = db.sequelize;
        if (sequelizeInstance) {
          const queryInterface = sequelizeInstance.getQueryInterface();
          
          const tableDefinition = await queryInterface.describeTable('ganado');
          
          if (!tableDefinition.estado) {
            await queryInterface.addColumn('ganado', 'estado', {
              type: sequelizeInstance.Sequelize.STRING(50),
              allowNull: false,
              defaultValue: 'activo'
            });
            console.log('--- Migración automática exitosa: Columna "estado" añadida a la tabla ganado ---');
          }
        }
      } catch (error) {
        console.log('\n======================================================');
        console.log('Aviso de BD Local: No se pudo verificar la columna "estado".');
        console.log('Razón:', error.message);
        console.log('======================================================\n');
      }

      // 🚀 INSERCIÓN AUTOMÁTICA DE USUARIOS DE PRUEBA DESDE EL .ENV
      try {
        const bcrypt = require('bcrypt');
        const usuariosPrueba = [
          {
            nombre: process.env.ADMIN_NOMBRE,
            cedula: process.env.ADMIN_CEDULA,
            email: process.env.ADMIN_EMAIL,
            telefono: process.env.ADMIN_TELEFONO,
            area: 'administracion',
            tipo: 'administrador',
            passwordPlana: process.env.ADMIN_PASSWORD
          },
          {
            nombre: process.env.CULTIVOS_NOMBRE,
            cedula: process.env.CULTIVOS_CEDULA,
            email: process.env.CULTIVOS_EMAIL,
            telefono: process.env.CULTIVOS_TELEFONO,
            area: 'cultivos',
            tipo: 'trabajador',
            passwordPlana: process.env.CULTIVOS_PASSWORD
          },
          {
            nombre: process.env.GANADERIA_NOMBRE,
            cedula: process.env.GANADERIA_CEDULA,
            email: process.env.GANADERIA_EMAIL,
            telefono: process.env.GANADERIA_TELEFONO,
            area: 'ganaderia',
            tipo: 'trabajador',
            passwordPlana: process.env.GANADERIA_PASSWORD
          }
        ];

        for (const u of usuariosPrueba) {
          if (u.email && u.passwordPlana) {
            const existe = await db.Usuario.findOne({ where: { email: u.email } });
            if (!existe) {
              const hashedPassword = await bcrypt.hash(u.passwordPlana, 10);
              await db.Usuario.create({
                nombre: u.nombre || 'Usuario Test',
                cedula: u.cedula || '0000000000',
                email: u.email,
                telefono: u.telefono || '0000000000',
                area: u.area,
                tipo: u.tipo,
                password: hashedPassword,
                activo: true
              });
              console.log(`--- Usuario de prueba creado automáticamente: ${u.nombre} (${u.email}) ---`);
            }
          }
        }
      } catch (seedError) {
        console.log('Aviso: No se pudieron crear los usuarios de prueba automáticamente:', seedError.message);
      }
    });
  }
} 

module.exports = app;