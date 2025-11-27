# Dockerfile para Node.js
FROM node:18-slim

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código do servidor
COPY server ./server

# Copiar arquivos de dados (CSV e XLSX)
COPY *.csv ./
# Copiar arquivos XLSX - o padrão deve funcionar se os arquivos estiverem no contexto
# Se o arquivo não existir, o build falhará, mas o servidor tratará isso graciosamente
COPY *.xlsx ./

# Copiar código do cliente e fazer build
COPY client ./client
RUN mkdir -p /app/client/public && \
    if [ ! -f /app/client/public/index.html ]; then \
      printf '%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n%s\n' \
        '<!DOCTYPE html>' \
        '<html lang="pt-BR">' \
        '  <head>' \
        '    <meta charset="utf-8" />' \
        '    <meta name="viewport" content="width=device-width, initial-scale=1" />' \
        '    <title>Syllabus - Sistema de Gerenciamento</title>' \
        '  </head>' \
        '  <body>' \
        '    <div id="root"></div>' \
        '  </body>' \
        '</html>' > /app/client/public/index.html; \
    fi
WORKDIR /app/client
RUN npm install && npm run build

# Voltar para diretório raiz
WORKDIR /app

# Expor porta
EXPOSE 5001

# Comando para iniciar servidor
CMD ["node", "server/server.js"]

