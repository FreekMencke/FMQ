import { readFileSync } from 'fs';

export type MongoConfig = {
  url: string;
  user: string;
  password: string;
};

const secretFile = JSON.parse(readFileSync('/run/secrets/mongo-config.json', 'utf8'));

export const mongoConfig: MongoConfig = {
  user: process.env.MONGO_USER || secretFile.user,
  password: process.env.MONGO_PASSWORD || secretFile.password,
  url: process.env.MONGO_URL || secretFile.url,
};
