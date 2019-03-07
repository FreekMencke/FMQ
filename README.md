[![Build Status](https://travis-ci.com/toxsickcoder/tox-mq.svg?branch=master)](https://travis-ci.com/toxsickcoder/tox-mq)
[![GitHub license](https://img.shields.io/github/license/toxsickcoder/node-typescript-starter.svg)](https://github.com/toxsickcoder/node-typescript-starter/blob/master/LICENSE)

# ToxMQ

I needed a simple queuing system for some projects so I decided to write my own MQ. I just needed basic functionality and didn't want too much overhead. It exposes itself with an API written in Express and persists itself using a Mongo database.

ToxMQ is multithread and replica safe.

## Getting started

To get started with ToxMQ you can either clone this repository and build/run it yourself, or you can pull the [Docker container](https://cloud.docker.com/u/toxsickcoder/repository/docker/toxsickcoder/tox-mq) from Docker hub.

### Docker

`docker pull toxsickcoder/tox-mq:latest`

To run the ToxMQ from the container, we need to provide the details to connect with the Mongo DB. We can either provide this as an environment variable **or** a secret (recommended). If both are provided, the environment variables will be prioritized.

The container runs on port 8080, but you can map it to whatever you want with docker.

#### Docker environment variables

- **MONGO_USER**: The username used to connect with your Mongo DB.
- **MONGO_PASSWORD**: The password used to connect with your Mongo DB.
- **MONGO_URL**: The url used to connect with your Mongo DB (mongodb://...).

#### Docker secret

```ts
{
  "url": "mongodb://...",
  "user": "username",
  "password": "password"
}
```

## Concepts

ToxMQ uses basic MQ concepts with a few extras. The actions you can perform on a queue are:

- [AckMany](#ackmany)
- [PingMany](#pingmany)
- [PopOne](#popone)
- [PopMany](#popmany)
- [PushOne](#pushone)
- [PushMany](#pushmany)
- [Size](#size)

It also utilizes a concept called **Command history**. Command history can be used by **Push** actions to determine if a push with that data has already occured, and thus ignored. You can use the Command history by sending a unique hash and a duration during which this duplicate shouldn't be added to the queue (default 300 seconds).

All actions are **safe to be called simultaniously**, which makes ToxMQ perfect to use with docker replicas for example.

## Queues

You can use as many queues as you want, there is no limit. All requests to perform actions on a queue have to start with `/queue/:queueName`. For example, we could check the size of the `test` queue by performing `GET /queue/test/size`.

## API

### AckMany

Endpoint: `POST /queue/:queueName/ack`

Possible status codes: `204` and `500`.

Expected payload:

```ts
id: string[]
```

### PingMany

Endpoint: `POST /queue/:queueName/ping(?expiresIn=[number])`

Possible status codes: `200` and `500`.

Expected payload:

```ts
id: string[]
```

### PopOne

Endpoint: `POST /queue/:queueName/pop(?expiresIn=[number])`

Possible status codes: `200`, `204` and `500`.

Returns:

```ts
{
  "_id": string,
  "payload": any,
  "attempts": number,
  "expiryDate": Date
}
```

### PopMany

Endpoint: `POST /queue/:queueName/pop/:amount(?expiresIn=[number])`

Possible status codes: `200`, `204` and `500`.

Returns:

```ts
[{
  "_id": string,
  "payload": any,
  "attempts": number,
  "expiryDate": Date
}, ...]
```

### PushOne

Endpoint: `POST /queue/queueName/pop(?hashCode=[string])(&expiresIn=[number])`

Possible status codes: `201`, `204` and `500`.

Expected payload:

```ts
{}: any
```

### PushMany

Endpoint: `POST /queue/queueName/pop(?hashCode=[string])(&expiresIn=[number])`

Possible status codes: `201`, `204` and `500`.

Expected payload:

```ts
[{}, ...]: any[]
```

### Size

Endpoint: `GET /queue/:queueName/size`

Possible status codes: `200` and `500`.

Returns:

```ts
{
  "size": number
}
```
