FROM node:18-alpine as bundleBuilder
WORKDIR /usr/src/app/
COPY . .
RUN npm ci
RUN npm run lint
RUN npm run build:ci

FROM node:18-alpine as prodDependencies
WORKDIR /usr/src/app/
COPY package.json package-lock.json ./
RUN npm ci --prod

FROM node:18-alpine
WORKDIR /usr/app/
COPY --from=bundleBuilder /usr/src/app/dist/ ./
COPY --from=prodDependencies /usr/src/app/node_modules ./node_modules
EXPOSE 8080
HEALTHCHECK  --interval=1m --timeout=2s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD [ "node", "fmq.js" ]
