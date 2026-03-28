# Multi-stage Dockerfile for Ion Arc Online (Astro SSG)
# Optimized for Coolify and high-volume static generation

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Enable high memory limit for 77k+ page generation
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine AS runtime

# Copy the static export from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to handle SPA routing if needed (though this is SSG)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
