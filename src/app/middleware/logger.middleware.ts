import { NextFunction, Request, RequestHandler, Response } from 'express';
import { LogUtils } from '../common/log-utils';

export const requestLogger = (blacklist: string[] = []): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime();

  next();

  if (blacklist.some(url => req.originalUrl.startsWith(url))) return;

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsedTime = `${Math.floor((seconds * 1e3) + (nanoseconds / 1e6))}ms`;

    LogUtils.log(req.method, req.originalUrl + ';', res.statusCode, res.statusMessage + ';', elapsedTime);
  });
};
