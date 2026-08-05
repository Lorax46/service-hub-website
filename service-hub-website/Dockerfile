FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN rm -rf .next
RUN npm run build

FROM node:22-slim AS runner
# LABEL org.opencontainers.image.source moved here (was in deps stage - not inherited in multi-stage builds)
LABEL org.opencontainers.image.source=https://github.com/lorax46/service-hub-website
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs
# Criar diretórios necessários com permissões corretas para o usuário nextjs
RUN mkdir -p /app/data /app/.next && chown -R nextjs:nodejs /app
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
# migrations/ removed - only needed for mount in Postgres init container, not runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT 3000

# HEALTHCHECK - verifica endpoint /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "import('node:http').then(http=>{const req=http.request('http://localhost:3000/api/health',(res)=>{process.exit(res.statusCode===200?0:1);});req.on('error',()=>process.exit(1));req.end();})"

CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
