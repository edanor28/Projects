# Utilizamos Alpine Linux por su reducida superficie de ataque (aprox 5MB).
FROM node:22-alpine AS builder

# Prisma Engine requiere OpenSSL (Librería criptográfica en C) para funcionar en Alpine
RUN apk add --no-cache openssl

# Establecemos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos SOLO los manifiestos de dependencias primero. 
# Esto optimiza la caché de capas de Docker (Layer Caching - O(1) build time).
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# INSTALACIÓN DETERMINISTA: 'npm ci' respeta el package-lock exacto (Previene Supply Chain Attacks)
RUN npm install

# Generamos los binarios de Prisma basados en el esquema
RUN npx prisma generate

# Copiamos el resto del código fuente
COPY . .

# Compilamos TypeScript a JavaScript puro
RUN npm run build

# Purgamos dependencias de desarrollo (DevDependencies) para no subirlas a producción
RUN npm ci --omit=dev && npm cache clean --force

# ETAPA 2: PRODUCTION (Entorno de Ejecución Aislado)

FROM node:22-alpine AS production

# Instalamos OpenSSL de nuevo porque esta es una máquina virtual completamente limpia
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# VARIABLE CRÍTICA: Node.js optimiza el Garbage Collector y oculta Stack Traces en producción
ENV NODE_ENV=production
ENV PORT=3001

# COPIA QUIRÚRGICA: Solo transferimos el código compilado y las librerías estrictamente necesarias
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./

# SEGURIDAD (Zero Trust): Cambiamos del usuario 'root' al usuario sin privilegios 'node'
# Si un atacante vulnera NestJS, no tendrá permisos para instalar malware en este contenedor.
USER node

# Exponemos el puerto documentado
EXPOSE 3001

# Comando de arranque inmutable (No usamos ts-node ni nodemon en producción)
CMD ["node", "dist/main"]