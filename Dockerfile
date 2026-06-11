# Build stage: install workspace deps, build frontend + server
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/prompt-atrium/package.json artifacts/prompt-atrium/
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/prompt-crud/package.json lib/prompt-crud/
COPY scripts/package.json scripts/

RUN pnpm install --frozen-lockfile \
      --filter @workspace/api-server... \
      --filter @workspace/prompt-atrium...

COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server
COPY artifacts/prompt-atrium ./artifacts/prompt-atrium
COPY attached_assets ./attached_assets

RUN pnpm --filter @workspace/prompt-atrium run build \
 && pnpm --filter @workspace/api-server run build \
 && cp -r artifacts/prompt-atrium/dist/public artifacts/api-server/dist/public

# Runtime stage: production deps + bundles only
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/

RUN pnpm install --frozen-lockfile --prod --filter @workspace/api-server...

COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/lib ./lib

EXPOSE 8080
WORKDIR /app/artifacts/api-server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
