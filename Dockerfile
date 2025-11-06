# Dockerfile para instalar wkhtmltopdf e Node.js
FROM node:18-slim

# Instalar dependências do sistema necessárias para wkhtmltopdf
RUN apt-get update && apt-get install -y \
    wget \
    xvfb \
    xfonts-75dpi \
    xfonts-base \
    libjpeg62-turbo \
    fontconfig \
    libxrender1 \
    libxtst6 \
    libxi6 \
    && rm -rf /var/lib/apt/lists/*

# Instalar wkhtmltopdf
# Baixar e instalar o pacote .deb oficial
RUN wget -q https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb \
    && dpkg -i wkhtmltox_0.12.6.1-2.bullseye_amd64.deb || apt-get install -yf \
    && rm -f wkhtmltox_0.12.6.1-2.bullseye_amd64.deb

# Garantir que wkhtmltopdf está acessível no PATH
# O pacote instala em /usr/local/bin, criar symlink em /usr/bin
RUN if [ -f /usr/local/bin/wkhtmltopdf ] && [ ! -f /usr/bin/wkhtmltopdf ]; then \
      ln -s /usr/local/bin/wkhtmltopdf /usr/bin/wkhtmltopdf; \
    fi

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

