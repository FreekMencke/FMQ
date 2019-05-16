import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Logger } from '../common/logger';

export const responseLogger = (blacklist: string[] = []): RequestHandler => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();

  if (blacklist.some(url => req.originalUrl.startsWith(url))) return;

  Logger.log(res.statusCode, req.method, req.originalUrl);
};
