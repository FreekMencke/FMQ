import { readFileSync } from 'fs';

export type MongoConfig = {
  url: string;
  user: string;
  password: string;
};

export const mongoConfig: MongoConfig = JSON.parse(readFileSync('/run/secrets/mongo-config.json', 'utf8'));
