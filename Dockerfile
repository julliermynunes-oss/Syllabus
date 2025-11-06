# Dockerfile para instalar Puppeteer (Chrome headless) e Node.js
FROM node:18-slim

# Instalar dependências do sistema necessárias para Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código do servidor
COPY server ./server

# Copiar código do cliente e fazer build
COPY client ./client
WORKDIR /app/client
RUN npm install && npm run build

# Voltar para diretório raiz
WORKDIR /app

# Expor porta
EXPOSE 5001

# Comando para iniciar servidor
CMD ["node", "server/server.js"]

