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

# Verificar onde o wkhtmltopdf foi instalado e criar symlinks
RUN echo "=== Verificando instalação do wkhtmltopdf ===" && \
    WKHTMLTOPDF_PATH=$(find /usr -name "wkhtmltopdf" -type f 2>/dev/null | head -1) && \
    if [ -n "$WKHTMLTOPDF_PATH" ]; then \
      echo "wkhtmltopdf encontrado em: $WKHTMLTOPDF_PATH"; \
      ln -sf "$WKHTMLTOPDF_PATH" /usr/local/bin/wkhtmltopdf 2>/dev/null || true; \
      ln -sf "$WKHTMLTOPDF_PATH" /usr/bin/wkhtmltopdf 2>/dev/null || true; \
      echo "Symlinks criados"; \
    else \
      echo "Aviso: wkhtmltopdf não encontrado após instalação, mas continuando..."; \
      echo "Tentando localizar em outros locais..."; \
      find / -name "wkhtmltopdf" -type f 2>/dev/null | head -5 || echo "Não encontrado em nenhum lugar"; \
    fi

# Verificar se conseguimos executar o wkhtmltopdf
RUN echo "=== Testando wkhtmltopdf ===" && \
    (wkhtmltopdf --version 2>&1 | head -1 || echo "Aviso: wkhtmltopdf não respondeu") && \
    (which wkhtmltopdf && echo "wkhtmltopdf encontrado no PATH" || echo "wkhtmltopdf não está no PATH") && \
    (ls -la /usr/local/bin/wkhtmltopdf /usr/bin/wkhtmltopdf 2>/dev/null || echo "Symlinks não criados")

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

