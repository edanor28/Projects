
# ETAPA 1: DEPENDENCIAS (Caché optimizada)
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalación limpia para prevenir ataques de cadena de suministro
COPY package.json package-lock.json ./
RUN npm ci


# ETAPA 2: BUILDER (Compilación de React/Next.js)

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p ./public

# Deshabilitamos la telemetría de Next.js (Privacidad y Seguridad de Datos)
ENV NEXT_TELEMETRY_DISABLED 1

# Compilamos la aplicación (aquí se genera la carpeta 'standalone')
RUN npm run build


# ETAPA 3: RUNNER (Entorno de Producción Zero Trust)

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# SEGURIDAD: Creamos un grupo y usuario sin privilegios específicos para el frontend
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos solo los recursos públicos estáticos
COPY --from=builder /app/public ./public

# Copiamos el output optimizado (Standalone) y le damos propiedad al usuario sin privilegios
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiamos al usuario seguro antes de ejecutar la aplicación
USER nextjs

EXPOSE 3000

# Arrancamos el servidor Node.js ultra-optimizado directamente (sin 'npm start')
CMD ["node", "server.js"]