import { Application } from 'express';
import { Db } from 'mongodb';

export interface RouterFactory {
  create(app: Application, db: Db): void;
}
