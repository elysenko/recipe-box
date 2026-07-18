# syntax=docker/dockerfile:1
# Combined frontend + backend container for recipe-box-staging.
# nginx serves the Vite/React SPA and proxies /api/ to the Node backend on 127.0.0.1:3000.
# supervisord (PID 1) runs both processes.

# ── frontend-builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=error || \
    npm install --no-audit --no-fund --loglevel=error
COPY web/ ./
RUN npx vite build

# ── backend-builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=error || \
    npm install --no-audit --no-fund --loglevel=error
COPY backend/ ./
RUN npx prisma generate
RUN npm run build \
    && test -n "$(find /app/backend/dist -name server.js | head -1)" \
       || (echo 'ERROR: no server.js in dist — check tsconfig rootDir' && exit 1)

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache nginx supervisor

# nginx site config (SPA + /api proxy)
COPY nginx.conf /etc/nginx/http.d/default.conf
RUN rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# supervisord config
COPY supervisord.conf /etc/supervisord.conf

# Frontend static assets
RUN mkdir -p /usr/share/nginx/html
COPY --from=frontend-builder /app/web/dist/ /usr/share/nginx/html/

# Backend app (dist + node_modules + package.json + prisma)
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
