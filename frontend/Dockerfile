FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_-prefixed env vars into the bundle at build time (not
# read at container runtime), so this must be passed as a Docker build arg —
# Railway auto-populates ARGs that match a configured service variable name.
# Without it, the build still succeeds but silently falls back to the
# code's own http://localhost:5103 default (see src/public/api.ts /
# src/admin/api/client.ts), which is broken in production.
# VITE_API_URL is the one actually read by the app code; VITE_API_BASE_URL
# is accepted too since that's the name Railway's variable scan picked up —
# both are wired through so a value under either name reaches the build.
ARG VITE_API_URL
ARG VITE_API_BASE_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN test -n "$VITE_API_URL" || test -n "$VITE_API_BASE_URL" || \
    (echo "ERROR: API URL build variable is missing" && exit 1)

RUN npm run build

FROM caddy:2-alpine

WORKDIR /app

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app/dist

EXPOSE 8080

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
