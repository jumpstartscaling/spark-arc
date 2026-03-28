# Hybrid Dockerfile for Ion Arc Online (Static nginx + Node.js Admin API)
# Optimized for Coolify with hot-swap PSEO rebuild capability

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Enable high memory limit for 77k+ page generation
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Build arguments that become env vars during build
ARG PUBLIC_N8N_WEBHOOK_TEST_URL
ARG PUBLIC_N8N_WEBHOOK_URL
ARG PUBLIC_GA_ID
ARG PUBLIC_CLARITY_ID
ARG PUBLIC_META_PIXEL_ID
ARG PUBLIC_TIKTOK_PIXEL_ID
ARG PUBLIC_PINTEREST_TAG_ID
ARG PUBLIC_X_TAG_ID
ARG PUBLIC_GOOGLE_SITE_VERIFICATION
ARG PUBLIC_BING_VERIFICATION
ARG PUBLIC_PINTEREST_VERIFICATION
ARG PUBLIC_SITE_URL

ENV PUBLIC_N8N_WEBHOOK_TEST_URL=$PUBLIC_N8N_WEBHOOK_TEST_URL
ENV PUBLIC_N8N_WEBHOOK_URL=$PUBLIC_N8N_WEBHOOK_URL
ENV PUBLIC_GA_ID=$PUBLIC_GA_ID
ENV PUBLIC_CLARITY_ID=$PUBLIC_CLARITY_ID
ENV PUBLIC_META_PIXEL_ID=$PUBLIC_META_PIXEL_ID
ENV PUBLIC_TIKTOK_PIXEL_ID=$PUBLIC_TIKTOK_PIXEL_ID
ENV PUBLIC_PINTEREST_TAG_ID=$PUBLIC_PINTEREST_TAG_ID
ENV PUBLIC_X_TAG_ID=$PUBLIC_X_TAG_ID
ENV PUBLIC_GOOGLE_SITE_VERIFICATION=$PUBLIC_GOOGLE_SITE_VERIFICATION
ENV PUBLIC_BING_VERIFICATION=$PUBLIC_BING_VERIFICATION
ENV PUBLIC_PINTEREST_VERIFICATION=$PUBLIC_PINTEREST_VERIFICATION
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build initial static site
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runtime

# Install nginx for static file serving
RUN apk add --no-cache nginx

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Copy server and configuration files
COPY server.js ./
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Create required directories
RUN mkdir -p /app/src/data/pseo /var/log/nginx

# Expose port 80 for nginx
EXPOSE 80

# Set entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

