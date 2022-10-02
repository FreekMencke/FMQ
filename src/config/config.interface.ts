import { AuthMechanism } from 'mongodb';

export interface IConfig {
  allowedOrigins?: string[];

  port: number;
  portMetrics: number;

  mongo: {
    url: string;
    user?: string;
    password?: string;
    authSource?: string;
    authMechanism?: AuthMechanism;
  };
}
