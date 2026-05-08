FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --force
RUN pnpm turbo run build --filter=admin

FROM caddy:2-alpine AS runner
WORKDIR /srv

COPY --from=builder /app/apps/admin/dist ./admin
COPY apps/admin/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
