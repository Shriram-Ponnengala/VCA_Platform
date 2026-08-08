# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base
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

EXPOSE 3000
# Default command for development hot-reloading
CMD ["npx", "turbo", "run", "dev", "--filter=web"]

# ==========================================
# Stage 4: Builder
# ==========================================
FROM deps AS builder
COPY . .
RUN npx turbo run build --filter=web

# ==========================================
# Stage 5: Production (Optimized final image)
# ==========================================
FROM base AS production
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["npx", "turbo", "run", "start", "--filter=web"]
