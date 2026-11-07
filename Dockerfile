# Etapa 1: gera o build estático (dist/) com a URL da API de produção embutida.
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL
ARG VITE_APK_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APK_URL=$VITE_APK_URL
RUN npm run build

# Etapa 2: Caddy serve os arquivos. O Caddyfile (domínios, HTTPS, proxy da API)
# vem do verti_backend/deploy e é montado pelo docker-compose.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
