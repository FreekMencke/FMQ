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
CMD [ "node", "tox-mq.js" ]
