FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/packages/ui/package.json ./frontend/packages/ui/
COPY frontend/apps/web/package.json ./frontend/apps/web/

RUN npm ci

COPY frontend/ ./frontend/
COPY tsconfig.json ./

RUN npm run build --workspace=@systrol/ui
RUN npm run build --workspace=@systrol/web

FROM nginx:1.27-alpine

COPY --from=builder /app/frontend/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
