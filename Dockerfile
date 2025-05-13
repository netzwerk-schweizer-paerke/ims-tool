FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY .yarnrc.yml ./
COPY .yarn ./.yarn/
COPY package.json yarn.lock ./

RUN yarn --immutable

# Build the application
FROM base AS builder
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY . .

RUN yarn build

# Create production image
FROM base AS runner
ENV TZ=Europe/Zurich
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

RUN mkdir .logs
RUN chown nextjs:nodejs .logs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=10 \
  CMD node -e "fetch('http://localhost:3000').then(x => x.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
