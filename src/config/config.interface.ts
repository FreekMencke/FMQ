export interface IConfig {
  port: number;
  mongo: {
    url: string;
    user: string;
    password: string;
  };
}
