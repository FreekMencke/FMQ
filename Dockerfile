FROM node:18-alpine as builder
WORKDIR /usr/src/app/
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build:ci

FROM node:18-alpine
EXPOSE 8080
HEALTHCHECK  --interval=1m --timeout=2s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD [ "node", "fmq.js" ]
