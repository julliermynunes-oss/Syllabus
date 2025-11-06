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

# Verificar onde o wkhtmltopdf foi instalado
RUN echo "=== Verificando instalação do wkhtmltopdf ===" && \
    ls -la /usr/local/bin/wkhtmltopdf 2>/dev/null || echo "Não encontrado em /usr/local/bin" && \
    ls -la /usr/bin/wkhtmltopdf 2>/dev/null || echo "Não encontrado em /usr/bin" && \
    find /usr -name "wkhtmltopdf" 2>/dev/null | head -5 || echo "wkhtmltopdf não encontrado em /usr"

# Garantir que wkhtmltopdf está acessível no PATH
# Criar symlinks em múltiplos locais para garantir acesso
RUN if [ -f /usr/local/bin/wkhtmltopdf ]; then \
      echo "wkhtmltopdf encontrado em /usr/local/bin, criando symlinks..."; \
      ln -sf /usr/local/bin/wkhtmltopdf /usr/bin/wkhtmltopdf || true; \
      ln -sf /usr/local/bin/wkhtmltopdf /usr/local/bin/wkhtmltopdf || true; \
    elif [ -f /usr/bin/wkhtmltopdf ]; then \
      echo "wkhtmltopdf já está em /usr/bin"; \
    else \
      echo "ERRO: wkhtmltopdf não foi instalado corretamente!"; \
      exit 1; \
    fi

# Verificar instalação do wkhtmltopdf
RUN echo "=== Testando wkhtmltopdf ===" && \
    /usr/local/bin/wkhtmltopdf --version 2>&1 | head -1 || echo "Aviso: versão não exibida" && \
    which wkhtmltopdf && \
    wkhtmltopdf --version 2>&1 | head -1 || echo "Aviso: wkhtmltopdf não respondeu, mas está instalado"

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

