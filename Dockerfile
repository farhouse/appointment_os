# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN npm install --production
# We need prisma client in production for the migrate deploy command to work if used in entrypoint, 
# though usually migrate deploy is run via a separate ephemeral container or CI/CD. 
# For simplicity in MVP, we keep it here.
RUN npm install -g prisma

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["node", ".output/server/index.mjs"]
