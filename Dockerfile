# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 loy

# Copy built application
COPY --from=builder --chown=loy:nodejs /app/dist ./dist
COPY --from=deps --chown=loy:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=loy:nodejs /app/package.json ./package.json
# Copy built frontend (served from frontend/dist)
COPY --from=builder --chown=loy:nodejs /app/frontend/dist ./frontend/dist

# Create logs directory
RUN mkdir -p logs && chown loy:nodejs logs

USER loy

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]
