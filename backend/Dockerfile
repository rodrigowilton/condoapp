FROM node:20-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código-fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Cria pasta de uploads
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/index.js"]
