# 1. Dependencias
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2. Ejecución
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Crear usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cambiar permisos de la carpeta al usuario sin privilegios
RUN chown -R expressjs:nodejs /app

USER expressjs
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
