# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
# Retry the install as well as individual fetches: a connection can reset
# after a package response has started streaming. Keep cached downloads.
RUN --mount=type=cache,id=travel-npm,target=/root/.npm \
    attempt=1; \
    until npm ci --prefer-offline --no-audit --no-fund \
        --fetch-retries=5 --fetch-retry-mintimeout=10000 \
        --fetch-retry-maxtimeout=60000 --maxsockets=5; do \
        if [ "$attempt" -ge 3 ]; then exit 1; fi; \
        echo "npm ci failed (attempt $attempt/3); retrying in 10 seconds..."; \
        attempt=$((attempt + 1)); \
        sleep 10; \
    done
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN --mount=type=cache,id=travel-next-build,target=/app/.next/cache npm run build

# Keep the project and dev dependencies: the seed script needs TypeScript,
# and the same image runs database maintenance commands.
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/.data/uploads && chown -R node:node /app/.data
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
