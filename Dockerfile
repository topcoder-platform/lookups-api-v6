# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.13.1
ARG PNPM_VERSION=11.15.1

FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION

RUN apk upgrade --no-cache \
    && apk add --no-cache 'zlib>=1.4-r0' bash

WORKDIR /app
COPY . .
RUN npm install --global pnpm@${PNPM_VERSION}
RUN pnpm install --frozen-lockfile
RUN pnpm run test:dependency-compat
RUN pnpm exec prisma generate
RUN pnpm run lint
RUN pnpm run build
RUN pnpm prune --prod

FROM alpine:3.24 AS runtime

ARG NODE_VERSION
# Alpine replaces old APK patch versions. Keep the configured Node major while
# accepting maintained patch releases and verify the selected runtime below.
RUN apk upgrade --no-cache \
    && apk add --no-cache 'libcrypto3>=3.5.9-r1' 'libssl3>=3.5.9-r1' 'zlib>=1.4-r0' bash "nodejs-current~${NODE_VERSION%%.*}" "nodejs-current>=${NODE_VERSION}-r0" \
    && test "$(node -p 'process.versions.node.split(".")[0]')" = "${NODE_VERSION%%.*}" \
    && addgroup -S -g 10001 app \
    && adduser -S -D -u 10001 -G app -h /home/app app

ARG RESET_DB_ARG=false
ENV RESET_DB=$RESET_DB_ARG
ARG SEED_DATA_ARG=""
ENV SEED_DATA=$SEED_DATA_ARG
ENV HOME=/home/app
ENV NODE_ENV=production
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

WORKDIR /app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/appStartUp.sh ./appStartUp.sh
RUN chmod +x appStartUp.sh
USER app
CMD ["./appStartUp.sh"]
