FROM node:18-alpine AS builder

WORKDIR /app

COPY server/package*.json ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm ci

WORKDIR /app
COPY server/ ./server/

WORKDIR /app/server
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/server/dist ./dist

EXPOSE 5001

CMD ["node", "dist/index.js"]
