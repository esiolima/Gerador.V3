FROM node:20-slim

# Instala dependências do sistema para o Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fontconfig \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    git \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (incluindo puppeteer-core que usará o Chromium do sistema)
RUN npm install --legacy-peer-deps

# Copia o restante do projeto
COPY . .

# Instala a fonte Inter como fonte de SISTEMA (nao so via @font-face no CSS).
# O motor de PDF do Chromium (page.pdf(), usado no journalHandler e no
# cardGenerator) sempre converte fontes carregadas via @font-face em Type3
# (um mini-desenho vetorial por caractere), o que deixa o texto praticamente
# impossivel de editar no Illustrator. Fontes ja instaladas no sistema, por
# outro lado, sao embutidas corretamente como fontes de verdade (Type0/
# TrueType). O alias abaixo faz "Inter" (nome usado em todo o CSS) apontar
# para os arquivos instalados, cujo nome interno e "Inter 28pt".
RUN mkdir -p /usr/share/fonts/truetype/inter \
    && cp fonts/Inter-Regular.ttf fonts/Inter-Bold.ttf fonts/Inter-Black.ttf /usr/share/fonts/truetype/inter/ \
    && printf '%s\n' \
      '<?xml version="1.0"?>' \
      '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">' \
      '<fontconfig>' \
      '  <match target="pattern">' \
      '    <test name="family"><string>Inter</string></test>' \
      '    <edit name="family" mode="prepend" binding="strong">' \
      '      <string>Inter 28pt</string>' \
      '    </edit>' \
      '  </match>' \
      '</fontconfig>' \
      > /etc/fonts/local.conf \
    && fc-cache -f

# Variáveis de ambiente para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Build do frontend e backend
RUN npm run build

# Expõe a porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
