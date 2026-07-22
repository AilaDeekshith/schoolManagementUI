# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (cached separately from source for faster rebuilds)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The backend API URL gets baked into the static JS bundle at build time.
# Passed in by Jenkins via --build-arg (see Jenkinsfile).
ARG VITE_BACK_END_URL
RUN echo "VITE_BACK_END_URL=${VITE_BACK_END_URL}" > .env.production

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]