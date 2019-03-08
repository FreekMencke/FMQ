[![Build Status](https://travis-ci.com/toxsickcoder/tox-mq.svg?branch=master)](https://travis-ci.com/toxsickcoder/tox-mq)
[![GitHub license](https://img.shields.io/github/license/toxsickcoder/node-typescript-starter.svg)](https://github.com/toxsickcoder/node-typescript-starter/blob/master/LICENSE)

# ToxMQ

ToxMQ is a simple message queuing system with little overhead.
It is exposed through an Express API and preserved through a Mongo database.

ToxMQ is multithread and replica safe.

## Getting started

Either clone and build this repository, or pull the [Docker container](https://cloud.docker.com/u/toxsickcoder/repository/docker/toxsickcoder/tox-mq) from Docker hub.

### Docker

`docker pull toxsickcoder/tox-mq:latest`

To run ToxMQ from a container, provide the Mongo DB connection details. The connection details can be provided as a secret (**recommended**) or an environment variable. If both sources are provided, the environment variables will be prioritized.

The container runs on port 8080, but can mapped to any port with docker.

#### Docker environment variables

- **MONGO_USER**: The username used to connect to the Mongo DB.
- **MONGO_PASSWORD**: The password used to connect to the Mongo DB.
- **MONGO_URL**: The url used to connect to the Mongo DB (mongodb://...).

#### Docker secret

```ts
{
  "url": "mongodb://...",
  "user": "username",
  "password": "password"
}
```

## Concepts

ToxMQ uses basic MQ concepts with a few extra features. The available actions are:

- [AckMany](#ackmany)
- [PingMany](#pingmany)
- [PopOne](#popone)
- [PopMany](#popmany)
- [PushOne](#pushone)
- [PushMany](#pushmany)
- [Size](#size)

ToxMQ also utilizes a concept called **Command history**. Command history can be used by **Push** actions to determine if a push with that data has already occured, and can therefor be ignored. Command history is used by sending a unique hash and a duration during which duplicate messages shouldn't be added to the queue (default 300 seconds).

All actions are **safe to be called simultaniously**, which makes ToxMQ perfect to use with docker replicas for example.

## Queues

Any number of queues can be used simultaneously. 
All requests to perform actions on a queue have to start with `/queue/:queueName`. For example, we could check the size of the `test` queue by performing `GET /queue/test/size`.

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
