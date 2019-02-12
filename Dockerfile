FROM node:10-alpine as builder
WORKDIR /usr/src/app/
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build:ci

FROM node:10-alpine
WORKDIR /usr/app/
COPY --from=builder /usr/src/app/dist/ ./
EXPOSE 8080
HEALTHCHECK  --interval=5m --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD [ "node", "tox-mq.js" ]
