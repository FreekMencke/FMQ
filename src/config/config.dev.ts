import { existsSync, readFileSync } from 'fs';
import { IConfig } from './config.interface';

const secretLocation = './src/config/secrets/mongo-config.json';
let secretMongoConfig: { user: string; password: string; url: string } | null = null;

if (existsSync(secretLocation)) {
  secretMongoConfig = JSON.parse(readFileSync(secretLocation, 'utf8'));
} else {
  console.log(`No secret found at ${secretLocation}`);
}

export const config: IConfig = {
  port: Number(process.env.PORT) || 8080,
  mongo: {
    user: process.env.MONGO_USER || (secretMongoConfig && secretMongoConfig.user) || 'NONE',
    password: process.env.MONGO_PASSWORD || (secretMongoConfig && secretMongoConfig.password) || 'NONE',
    url: process.env.MONGO_URL || (secretMongoConfig && secretMongoConfig.url) || 'NONE',
  },
};
