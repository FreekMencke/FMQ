![CI](https://github.com/FreekMencke/fmq/workflows/CI/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues/FreekMencke/fmq.svg)](https://github.com/FreekMencke/fmq/issues)
[![GitHub license](https://img.shields.io/github/license/FreekMencke/fmq.svg)](https://github.com/FreekMencke/fmq/blob/master/LICENSE)

# FMQ

FMQ is a simple message queuing system with little overhead.
It is exposed through an Express API and preserved through a Mongo database.

FMQ is multithread and replica safe.

## Getting started

Either clone and build this repository, or pull the [image](https://cloud.docker.com/u/freekmencke/repository/) from Docker hub.

### Kubernetes/Docker

`docker pull freekmencke/fmq:latest`

To run FMQ from a container, provide the Mongo DB connection details. The connection details can be provided as a secret (**recommended**) or an environment variable. If both sources are provided, the environment variables will be prioritized.

The container runs on port 8080, but can mapped to any port with docker. Metrics are available on port 8088 at `/metrics`.

#### Environment variables
- **ALLOWED_ORIGINS**: Comma separated list of allowed origins (CORS).

- **PORT**: The port FQM will listen for requests (default `8080`).
- **PORT_METRICS**: The port where metrics can be queried (default `8088`)

- **MONGO_USER**: The username used to connect to the Mongo DB.
- **MONGO_PASSWORD**: The password used to connect to the Mongo DB.
- **MONGO_URL**: The url used to connect to the Mongo DB (mongodb://...).
- **MONGO_AUTHSOURCE**: The database associated with the user credentials.
- **MONGO_AUTHMECHANISM**: The authentication mechanism that MongoDB will use for the connection.

## Concepts

### Actions

FMQ uses basic MQ concepts with a few extra features. The available actions are:

- [AckMany](#ackmany)
- [Peek](#peek)
- [PingMany](#pingmany)
- [PopOne](#popone)
- [PopMany](#popmany)
- [Push](#push)
- [Size](#size)

### Multi threading and replicating

All actions are **safe to be called simultaniously**, which makes FMQ perfect to use with docker replicas for example.

### Command History

FMQ also utilizes a concept called **Command history**. Command history can be used by **Push** actions to determine if a push with that data has already occured, and can therefore be ignored. Command history is used by sending a unique hash and a duration during which duplicate messages shouldn't be added to the queue (default 300 seconds).

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

### Peek

We can look at the messages in a queue using this endpoint. We can use the `filter` parameter to pass a json with [Mongo query operators](https://docs.mongodb.com/manual/reference/operator/) to look for specific messages. We can also use the `amount` and `offset` parameters to further customize our results.

Endpoint: `GET /queue/:queueName/peek(?filter=[json])(&amount=[number])(&offset=[number])`

Possible status codes: `200`, `204` and `500`.

Returns:

```ts
[{
  "_id": string,
  "payload": any,
  "attempts"?: number,
  "expiryDate"?: Date
},...]
```

### PingMany

When processing messages might take longer than the `expiresIn` parameter (standard 300s), we can use this endpoint to extend the time we have to process the message. We can use the optional `expiresIn` query parameter to choose how long we want to extend the messages (standard 300s).
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

### Push

The push method is used to put a new message on the queue. This call accepts an object (PushOne) or an array (PushMany).

To make sure that multiple docker containers trying to push the same message simultaniously will only add 1 message to the queue, we can use the optional `hashCode` parameter. The `hashCode` parameter will add this command to the [Command History](#command-history).

The hashCode should be a hash of your payload (you can add more values like dates to make it more unique). We can use the optional `expiresIn` parameter (standard 300s) to decide how long this command will be in the [Command History](#command-history). While there is a hash already in the history, any attempt to push the message will be ignored.

Endpoint: `POST /queue/queueName/push(?hashCode=[string])(&expiresIn=[number])`

Possible status codes: `201`, `204` and `500`.

Expected payload:

```ts
One:
{}: any

Many:
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
