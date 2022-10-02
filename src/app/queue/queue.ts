import { Db, Filter, ObjectId } from 'mongodb';
import { DateUtils } from '../common/utils/date-utils';
import { MongoUtils } from '../common/utils/mongo-utils';
import { CommandHistory } from './command-history';

export class Queue {

  static async ackMany(db: Db, queue: string, ids: string[]): Promise<number> {
    const collection = MongoUtils.collection(db, queue);

    const deletedCount = await collection
      .deleteMany({
        _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) },
        attempts: { $exists: true },
      })
      .then(res => res.deletedCount);

    return deletedCount || 0;
  }

  static async peek<T>(db: Db, queue: string, amount: number, offset: number, filter: Filter<T>): Promise<Object[]> {
    const collection = MongoUtils.collection(db, queue);

    const items = await collection
      .find(filter)
      .skip(offset)
      .limit(amount)
      .toArray();

    return items;
  }

  static async pingMany(db: Db, queue: string, ids: string[], expiresIn?: number): Promise<Date | null> {
    const collection = MongoUtils.collection(db, queue);

    const newExpiryDate = DateUtils.getExpiryDate(expiresIn);

    const updated = await collection.updateMany(
      { _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } },
      { expiryDate: newExpiryDate },
    );

    return updated.modifiedCount > 0 ? newExpiryDate : null;
  }

  static async popOne(db: Db, queue: string, expiresIn?: number): Promise<Object | null> {
    const collection = MongoUtils.collection(db, queue);

    const result = await collection.findOneAndUpdate(
      {
        expiryDate: { $not: { $gt: new Date() } },
        attempts: { $not: { $gte: 5 } },
      },
      {
        $set: { expiryDate: DateUtils.getExpiryDate(expiresIn) },
        $inc: { attempts: 1 },
      },
      { returnDocument: 'after' },
    );

    return result.value;
  }

  static async popMany(db: Db, queue: string, amount: number, expiresIn?: number): Promise<Object[] | null> {
    const collection = MongoUtils.collection(db, queue);

    return MongoUtils.findAndUpdateMany(
      {
        expiryDate: { $not: { $gt: new Date() } },
        attempts: { $not: { $gte: 5 } },
      },
      {
        $set: { expiryDate: DateUtils.getExpiryDate(expiresIn) },
        $inc: { attempts: 1 },
      },
      amount,
      collection,
    );
  }

  static async pushOne(db: Db, queue: string, payload: Object, hashCode?: string, expiresIn?: number): Promise<number> {
    const collection = MongoUtils.collection(db, queue);

    if (!(await CommandHistory.shouldExecute(db, hashCode, expiresIn))) return 0;

    const insertedCount = await collection
      .insertOne({ payload })
      .then(result => result.insertedId ? 1 : 0)
      .catch(e => CommandHistory.clearCommand(db, hashCode).then(() => { throw e; }));

    return insertedCount;
  }

  static async pushMany(
    db: Db,
    queue: string,
    payloads: Object[],
    hashCode?: string,
    expiresIn?: number,
  ): Promise<number> {
    const collection = MongoUtils.collection(db, queue);

    if (!(await CommandHistory.shouldExecute(db, hashCode, expiresIn))) return 0;

    const insertedCount = await collection
      .insertMany(payloads.map(payload => ({ payload })), { ordered: false })
      .then(result => result.insertedCount)
      .catch(e => CommandHistory.clearCommand(db, hashCode).then(() => { throw e; }));

    return insertedCount;
  }

  static async size(db: Db, queue: string): Promise<number> {
    const collection = MongoUtils.collection(db, queue);

    return collection.countDocuments();
  }

}
