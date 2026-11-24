FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/apps/web/package.json ./frontend/apps/web/

RUN npm ci

COPY frontend/apps/web/ ./frontend/apps/web/

RUN npm run build --workspace=@systrol/web

FROM nginx:1.27-alpine

COPY --from=builder /app/frontend/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
