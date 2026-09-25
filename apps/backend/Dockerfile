# Multi-stage Dockerfile for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies and build
RUN npm install
RUN cd apps/backend && npx prisma generate && npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "apps/backend/dist/main.js"]
