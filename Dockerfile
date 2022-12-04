FROM node:18-alpine as bundleBuilder
WORKDIR /usr/src/app/
COPY . .
RUN npm ci
RUN npm run lint
RUN npm run build:prod

FROM node:18-alpine
WORKDIR /usr/app/
COPY --from=bundleBuilder /usr/src/app/dist/ ./
EXPOSE 8080
HEALTHCHECK  --interval=1m --timeout=2s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
CMD [ "node", "fmq.js" ]
