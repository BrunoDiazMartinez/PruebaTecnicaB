# Use Node.js LTS
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 4000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Comando para iniciar el servidor
CMD ["npm", "start"]
