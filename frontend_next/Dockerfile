FROM node:20-slim

WORKDIR /app

# Only copy package files first to cache layers
COPY package*.json ./
RUN npm install --network-timeout=100000 --loglevel=verbose

COPY . .

EXPOSE 3000

# Skip the heavy build step for now and go straight to dev
CMD ["npm", "run", "dev"]
