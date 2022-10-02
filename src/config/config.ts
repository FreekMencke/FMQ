import { AuthMechanism } from 'mongodb';
import { IConfig } from './config.interface';

export const config: IConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? ['http://localhost'],

  port: Number(process.env.PORT) || 8080,
  portMetrics: Number(process.env.PORT_METRICS) || 8088,

  mongo: {
    url: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017',
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    authSource: process.env.MONGO_AUTHSOURCE,
    authMechanism: process.env.MONGO_AUTHMECHANISM as AuthMechanism ?? AuthMechanism.MONGODB_DEFAULT,
  },
};
