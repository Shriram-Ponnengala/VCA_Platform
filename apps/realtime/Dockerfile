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
# Copy all packages and apps for monorepo workspace resolution
COPY . .
# Install dependencies
RUN npm install

EXPOSE 4001
# Default command for development hot-reloading
CMD ["npx", "turbo", "run", "dev", "--filter=realtime"]

# ==========================================
# Stage 3: Builder
# ==========================================
FROM base AS builder
COPY . .
RUN npm install
RUN npx turbo run build --filter=realtime

# ==========================================
# Stage 4: Production (Optimized final image)
# ==========================================
FROM base AS production
ENV NODE_ENV=production

# Copy only the built code and necessary packages from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/realtime/package.json ./apps/realtime/package.json
COPY --from=builder /app/apps/realtime/dist ./apps/realtime/dist

EXPOSE 4001
CMD ["node", "apps/realtime/dist/index.js"]
