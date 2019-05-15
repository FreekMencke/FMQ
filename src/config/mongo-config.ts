import { existsSync, readFileSync } from 'fs';

export type MongoConfig = {
  url: string;
  user: string;
  password: string;
};

const secretLocation = '/run/secrets/mongo-config.json';
let secretMongoConfig: MongoConfig | null = null;

if (existsSync(secretLocation)) {
  console.log(`No secret found at ${secretLocation}`);
  secretMongoConfig = JSON.parse(readFileSync(secretLocation, 'utf8'));
}

export const mongoConfig: MongoConfig = {
  user: process.env.MONGO_USER || (secretMongoConfig && secretMongoConfig.user) || 'NONE',
  password: process.env.MONGO_PASSWORD || (secretMongoConfig && secretMongoConfig.password) || 'NONE',
  url: process.env.MONGO_URL || (secretMongoConfig && secretMongoConfig.url) || 'NONE',
};
