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

### Actions

ToxMQ uses basic MQ concepts with a few extra features. The available actions are:

- [AckMany](#ackmany)
- [PingMany](#pingmany)
- [PopOne](#popone)
- [PopMany](#popmany)
- [PushOne](#pushone)
- [PushMany](#pushmany)
- [Size](#size)

### Multi threading and replicating

All actions are **safe to be called simultaniously**, which makes ToxMQ perfect to use with docker replicas for example.

### Command History

ToxMQ also utilizes a concept called **Command history**. Command history can be used by **Push** actions to determine if a push with that data has already occured, and can therefor be ignored. Command history is used by sending a unique hash and a duration during which duplicate messages shouldn't be added to the queue (default 300 seconds).

### Dead queue

Some messages might not be able to complete successfully. To prevent the message from being permanently in the queue there is the **dead queue** system. After a messages has had 5 unsuccessful attempts, the message will be move to a dead queue. A dead queue is a queue with the same name as the normal queue, appended with `-dead`. 

For example we have a `player-hiscore-scraper` queue we use to push players to we want to have scraped. Somehow a non-existing username gets pushed and it fails 5 times. The user then gets moved to the `player-hiscore-scraper-dead` queue.

This allows us to easily see which messages failed. We could implement a system which will notify us when a message would fail to process.

## Queues

Any number of queues can be used simultaneously. 
All requests to perform actions on a queue have to start with `/queue/:queueName`. For example, we could check the size of the `test` queue by performing `GET /queue/test/size`.

## API

### AckMany

After we processed messages successfully, we use this endpoint to remove the messages from the queue. This is important, otherwise after the expiry time of message has passed the message will be available again on the queue.

Endpoint: `POST /queue/:queueName/ack`

Possible status codes: `204` and `500`.

Expected payload:

```ts
id: string[]
```

### PingMany

When processing messages might take longer than the `expiresIn` property (standard 300s), we can use this endpoint to extend the time we have to process the message. We can use the optional `expiresIn` query parameter to choose how long we want to extend the messages (standard 300s). 
If we don't and we pass the expiry date, the message will become available again on the queue before we can [AckMany](#ackmany) it.

Endpoint: `POST /queue/:queueName/ping(?expiresIn=[number])`

Possible status codes: `200` and `500`.

Expected payload:

```ts
id: string[]
```

### PopOne

We can call this method to retrieve a message from a certain queue. We can use the optional `expiresIn` parameter (standard 300s). After the `expiresIn` time has passed without an [AckMany](#ackmany) call, we assume the message failed to process and it will become available on the queue again, unless we [PingMany](#pingmany) it.

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

We can call this method to retrieve multiple messages from a certain queue. The `amount` route parameter is used to choose the amount of messages to pop. We can use the optional `expiresIn` parameter (standard 300s). After the `expiresIn` time has passed without an [AckMany](#ackmany) call, we assume the message failed to process and it will become available on the queue again, unless we [PingMany](#pingmany) it.

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

> TODO explanation

Endpoint: `POST /queue/queueName/pop(?hashCode=[string])(&expiresIn=[number])`

Possible status codes: `201`, `204` and `500`.

Expected payload:

```ts
{}: any
```

### PushMany

> TODO explanation

Endpoint: `POST /queue/queueName/pop(?hashCode=[string])(&expiresIn=[number])`

Possible status codes: `201`, `204` and `500`.

Expected payload:

```ts
[{}, ...]: any[]
```

### Size

We can use this endpoint to check howmany messages are left on a certain queue.

Endpoint: `GET /queue/:queueName/size`

Possible status codes: `200` and `500`.

Returns:

```ts
{
  "size": number
}
```
