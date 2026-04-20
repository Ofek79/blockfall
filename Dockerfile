# ============================================================
# Dockerfile — multi-stage build for Google Cloud Run
#
# Stage 1 (builder): installs deps and builds the Vite app
# Stage 2 (runner):  serves with nginx (static file server)
#
# Final image is ~25 MB (nginx:alpine) — no Node.js runtime needed.
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first for better Docker layer caching
COPY package*.json ./

# Skip Electron binary download — not needed for the web/nginx build
RUN ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci

# Copy source
COPY . .

# Build the Vite production bundle
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine AS runner

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config: serve SPA (all routes → index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run sends traffic to port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
