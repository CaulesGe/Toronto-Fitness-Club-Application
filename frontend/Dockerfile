# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage (non-root) ---
FROM nginxinc/nginx-unprivileged:1.27

# Copy custom nginx config (listens on 8080, SPA fallback)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=build /app/build/ /usr/share/nginx/html/

# Expose port 8080 (unprivileged nginx default)
EXPOSE 8080

# Run nginx (the unprivileged image already runs as non-root)
CMD ["nginx", "-g", "daemon off;"]
