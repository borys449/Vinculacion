# 🌾 Sistema de Gestión Agropecuaria - Finca LODANA

Bienvenido a la guía de instalación y ejecución del proyecto **Finca LODANA**. Esta guía está diseñada para que cualquier integrante del equipo pueda clonar, instalar dependencias, levantar la base de datos de manera automática y ejecutar el sistema completo (Backend y Frontend) **sin errores**.

---

## 📌 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. **Node.js** (v18, v20 o superior recomendado): [Descargar Node.js](https://nodejs.org/)
2. **PNPM** (Gestor de paquetes obligatorio para este proyecto):
   - Si no lo tienes instalado, abre tu terminal y ejecuta:
     ```bash
     npm install -g pnpm
     ```
3. **Docker Desktop** *(Recomendado para levantar la base de datos con un solo comando)*: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)  
   *(Asegúrate de que Docker Desktop esté abierto y corriendo)*.  
   *Nota: Si no usas Docker, puedes usar una instalación local de PostgreSQL 12+*.

> [!IMPORTANT]
> ### ⚠️ Solución al error común de PNPM en Windows (PowerShell)
> Si al ejecutar `pnpm` en PowerShell te sale el error:  
> `pnpm.ps1 no se puede cargar porque la ejecución de scripts está deshabilitada en este sistema...`  
> 
> **Solución rápida:** Abre PowerShell y ejecuta este comando una sola vez:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> O como alternativa, puedes ejecutar `pnpm.cmd` en lugar de `pnpm`, o usar la terminal de **Git Bash** / **Símbolo del sistema (CMD)**.

---

## 🚀 Paso a Paso: Puesta en Marcha Rápida

El proyecto se compone de dos carpetas principales:
- `backend-vinculacion`: API REST (Node.js, Express, Sequelize, PostgreSQL).
- `fronted-vinculacion`: Interfaz Web (Next.js 15, React 19, Tailwind CSS).

---

### PASO 1. Instalar Todas las Librerías (Dependencias con PNPM)

Para evitar problemas de librerías faltantes o dependencias incompatibles, instala las dependencias en ambas carpetas con `pnpm`:

#### 1.1 Backend
Abre una terminal en la raíz del proyecto y entra a la carpeta del backend:
```bash
cd backend-vinculacion
pnpm install
```

#### 1.2 Frontend
En otra terminal (o regresando con `cd ..`), entra al frontend:
```bash
cd fronted-vinculacion
pnpm install
```

---

### PASO 2. Variables de Entorno del Backend

Verifica o crea el archivo `.env` dentro de la carpeta `backend-vinculacion/`:

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=finca_lodana_secret_jwt_key_2026_segura

# Conexión a Base de Datos
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=finca_lodana
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres

# Credenciales del Administrador por Defecto
admin_name=Administrador General
admin_email=admin@lodana.com
admin_password=admin123
```

*(Si usas Docker con la configuración por defecto, `DB_PASSWORD` es `tu_contraseña_postgres`)*.

---

### PASO 3. Ejecutar Automáticamente la Base de Datos

Tienes el archivo `docker-compose.yml` listo dentro de `backend-vinculacion` para levantar PostgreSQL y pgAdmin automáticamente en segundo plano.

#### 🐳 Opción A: Con Docker (Recomendado - 100% Automático)

Desde la carpeta `backend-vinculacion/`, ejecuta:

```bash
docker compose up -d
```
*(o `docker-compose up -d` en versiones anteriores de Docker)*

Este comando automáticamente:
- Descarga y levanta el contenedor de **PostgreSQL 15** en el puerto `5432`.
- Crea la base de datos `finca_lodana` de forma automática.
- Inicia **pgAdmin 4** en `http://localhost:5050` (Email: `admin@agro.comb`, Password: `adminpassword123`).

Para verificar que el contenedor esté corriendo:
```bash
docker ps
```

#### 🐘 Opción B: Con PostgreSQL Local (Sin Docker)

Si tienes PostgreSQL instalado directamente en tu máquina:
1. Asegúrate de que el servicio de PostgreSQL esté iniciado.
2. Ejecuta el script de creación automática de base de datos desde `backend-vinculacion`:
   ```bash
   pnpm run db:create
   ```

---

### PASO 4. Migraciones y Creación del Usuario Administrador

Para que las tablas se creen y el **usuario Administrador** quede listo en la base de datos:

1. Asegúrate de estar en la carpeta `backend-vinculacion/`:
   ```bash
   cd backend-vinculacion
   ```

2. Ejecuta las migraciones de Sequelize:
   ```bash
   npx sequelize-cli db:migrate
   ```

3. Ejecuta el seeder para crear el **Usuario Administrador**:
   ```bash
   npx sequelize-cli db:seed:all
   ```

#### 🔑 Credenciales del Administrador Creado:
Una vez ejecutado, tendrás acceso inmediato al sistema con:
- **Email / Usuario:** `admin@lodana.com`
- **Contraseña:** `admin123`
- **Tipo / Rol:** `administrador`

> [!TIP]
> Si deseas personalizar el correo o contraseña del administrador antes de crearlo, cámbialos en el `.env` en `admin_email` y `admin_password` antes de correr el seeder.

---

### PASO 5. Iniciar Backend y Frontend

#### 5.1 Iniciar el Backend (Express API)
En la terminal dentro de `backend-vinculacion`:
```bash
pnpm dev
```
- El backend iniciará en: **`http://localhost:8080`**
- Conectará a la base de datos PostgreSQL y verificará las tablas automáticamente.

#### 5.2 Iniciar el Frontend (Next.js)
En otra terminal dentro de `fronted-vinculacion`:
```bash
pnpm dev
```
- El frontend iniciará en: **`http://localhost:3001`**

Abre tu navegador en **`http://localhost:3001`**, dirígete al login e ingresa con el usuario administrador.

---

## 🛠️ Resumen Rápido de Comandos

| Acción | Comando | Ubicación |
|---|---|---|
| **Instalar librerías Backend** | `pnpm install` | `backend-vinculacion/` |
| **Instalar librerías Frontend** | `pnpm install` | `fronted-vinculacion/` |
| **Levantar Base de Datos (Docker)** | `docker compose up -d` | `backend-vinculacion/` |
| **Detener Base de Datos (Docker)** | `docker compose down` | `backend-vinculacion/` |
| **Crear BD Local (Sin Docker)** | `pnpm run db:create` | `backend-vinculacion/` |
| **Ejecutar Migraciones** | `npx sequelize-cli db:migrate` | `backend-vinculacion/` |
| **Crear Usuario Admin** | `npx sequelize-cli db:seed:all` | `backend-vinculacion/` |
| **Iniciar Backend (dev)** | `pnpm dev` | `backend-vinculacion/` (Puerto 8080) |
| **Iniciar Frontend (dev)** | `pnpm dev` | `fronted-vinculacion/` (Puerto 3001) |

---

## ❓ Preguntas Frecuentes y Solución de Problemas

1. **¿Qué hago si sale `error connecting to PostgreSQL`?**
   - Verifica que el contenedor Docker esté activo con `docker ps`.
   - Revisa que tu contraseña en el `.env` coincida con la de `docker-compose.yml` (`tu_contraseña_postgres`).

2. **¿Cómo accedo a pgAdmin?**
   - Ingresa a `http://localhost:5050`.
   - Usuario: `admin@agro.comb`
   - Contraseña: `adminpassword123`
   - Conectar al servidor: Host: `postgres-db`, Puerto: `5432`, Usuario: `postgres`, Password: `tu_contraseña_postgres`.

3. **¿Cómo limpiar y reiniciar la base de datos desde cero en Docker?**
   ```bash
   docker compose down -v
   docker compose up -d
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
