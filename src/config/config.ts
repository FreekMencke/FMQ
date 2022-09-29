import { AuthMechanism } from 'mongodb';
import { IConfig } from './config.interface';

export const config: IConfig = {
  port: Number(process.env.PORT) || 8080,
  portMetrics: Number(process.env.PORT_METRICS) || 8088,
  mongo: {
    url: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017',
    user: process.env.MONGO_USER ?? 'admin',
    password: process.env.MONGO_PASSWORD ?? 'test',
    authSource: process.env.MONGO_AUTHSOURCE ?? 'admin',
    authMechanism: process.env.MONGO_URL as AuthMechanism ?? AuthMechanism.MONGODB_SCRAM_SHA1,
  },
};
