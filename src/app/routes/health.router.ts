import express from 'express';

export class HealthRouter {

  static create(app: express.Application): void {
    const router = express.Router();

    this.getItems(router);

    app.use('/health', router);
  }

  private static getItems(router: express.Router): void {
    router.get('/', (req, res) => res.status(200).send());
  }

}
