# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
# Install turbo
RUN npm install -g turbo

# ==========================================
# Stage 2: Development (Used by docker-compose)
# ==========================================
FROM base AS development
# Copy root configurations
COPY package.json package-lock.json turbo.json ./
# Copy all packages and apps for monorepo workspace resolution
COPY . .
# Install dependencies
RUN npm install

EXPOSE 3000
# Default command for development hot-reloading
CMD ["npx", "turbo", "run", "dev", "--filter=web"]

# ==========================================
# Stage 3: Builder
# ==========================================
FROM base AS builder
COPY . .
RUN npm install
RUN npx turbo run build --filter=web

# ==========================================
# Stage 4: Production (Optimized final image)
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
