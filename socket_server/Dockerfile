FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --network-timeout=100000 --loglevel=verbose

COPY . .

EXPOSE 4000

CMD ["node", "index.js"]
