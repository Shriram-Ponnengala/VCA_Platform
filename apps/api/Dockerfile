# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base
# Install OpenSSL required by Prisma
RUN apk update && apk add --no-cache openssl
WORKDIR /app
# Install turbo
RUN npm install -g turbo

# ==========================================
# Stage 2: Development (Used by docker-compose)
# ==========================================
FROM base AS development
# Copy all packages and apps for monorepo workspace resolution
COPY . .
# Install dependencies
RUN npm install
# Generate Prisma Client
RUN cd packages/database && npx prisma generate

EXPOSE 4000
# Default command for development hot-reloading
CMD ["sh", "-c", "cd packages/database && npx prisma db push && cd ../../ && npx turbo run dev --filter=api"]

# ==========================================
# Stage 3: Builder
# ==========================================
FROM base AS builder
COPY . .
RUN npm install
RUN cd packages/database && npx prisma generate
RUN npx turbo run build --filter=api

# ==========================================
# Stage 4: Production (Optimized final image)
# ==========================================
FROM base AS production
ENV NODE_ENV=production

# Copy only the built code and necessary packages from builder
# We rely on the optimized context from .dockerignore and builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
