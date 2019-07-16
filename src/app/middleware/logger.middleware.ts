import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Logger } from '../common/logger';

export const requestLogger = (blacklist: string[] = []): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime();

  next();

  if (blacklist.some(url => req.originalUrl.startsWith(url))) return;

  res.on('finish', () => {
    const end = process.hrtime(start);
    const elapsedTime = `${Math.floor(end[0] * 1000 + end[1] / 1000000)}ms`;

    Logger.log(req.method, req.originalUrl + ';', res.statusCode, res.statusMessage + ';', elapsedTime);
  });
};
