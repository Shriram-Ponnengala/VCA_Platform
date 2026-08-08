# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base
# Install OpenSSL required by Prisma
RUN apk update && apk add --no-cache openssl
WORKDIR /app
# Install turbo
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --network-timeout=1000000 -g turbo

# ==========================================
# Stage 2: Dependencies (Cache optimization)
# ==========================================
FROM base AS deps
# Copy root configurations
COPY package.json package-lock.json turbo.json ./

# Copy package.json for all workspaces to cache install step
COPY packages/chess/package.json ./packages/chess/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json

COPY apps/api/package.json ./apps/api/package.json
COPY apps/realtime/package.json ./apps/realtime/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --network-timeout=1000000

# ==========================================
# Stage 3: Development (Used by docker-compose)
# ==========================================
FROM deps AS development
# Copy all packages and apps for monorepo workspace resolution
COPY . .
# Generate Prisma Client
RUN cd packages/database && npx prisma generate

EXPOSE 4000
# Default command for development hot-reloading
CMD ["sh", "-c", "cd packages/database && npx prisma db push && cd ../../ && npx turbo run dev --filter=api"]

# ==========================================
# Stage 4: Builder
# ==========================================
FROM deps AS builder
COPY . .
RUN cd packages/database && npx prisma generate
RUN npx turbo run build --filter=api

# ==========================================
# Stage 5: Production (Optimized final image)
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
