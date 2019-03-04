import { Collection, Db, ObjectId } from 'mongodb';
import { v4 as uuidV4 } from 'uuid';
import { DateUtils as DateUtil } from '../common/date-util';
import { CommandHistory } from './command-history';

export class MessageQueue {
  static readonly QUEUE_PREFIX = 'queue-';

  static async ackMany(db: Db, queue: string, ids: string[]): Promise<number> {
    const collection = MessageQueue.collection(db, queue);

    const deletedCount = await collection
      .deleteMany({
        _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) },
        attempts: { $exists: true },
      })
      .then(res => res.deletedCount);

    return deletedCount || 0;
  }

  static async pingOne(db: Db, queue: string, id: string, expiresIn?: number): Promise<Date | null> {
    const collection = MessageQueue.collection(db, queue);

    const newExpiryDate = DateUtil.getExpiryDate(expiresIn);

    const updated = await collection.findOneAndUpdate(
      { _id: ObjectId.createFromHexString(id) },
      { expiryDate: newExpiryDate },
      { returnOriginal: true }
    );

    return updated.value ? newExpiryDate : null;
  }

  static async pingMany(db: Db, queue: string, ids: string[], expiresIn?: number): Promise<Date | null> {
    const collection = MessageQueue.collection(db, queue);

    const newExpiryDate = DateUtil.getExpiryDate(expiresIn);

    const updated = await collection.updateMany(
      { _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } },
      { expiryDate: newExpiryDate }
    );

    return updated.modifiedCount > 0 ? newExpiryDate : null;
  }

  static async popOne(db: Db, queue: string, expiresIn?: number): Promise<Object | null> {
    const collection = MessageQueue.collection(db, queue);

    const result = await collection.findOneAndUpdate(
      { $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }] },
      {
        $set: { expiryDate: DateUtil.getExpiryDate(expiresIn) },
        $inc: { attempts: 1 },
      },
      { returnOriginal: false }
    );

    return result.value;
  }

  static async popMany(db: Db, queue: string, amount: number, expiresIn?: number): Promise<Object[] | null> {
    const collection = MessageQueue.collection(db, queue);

    const uuid = uuidV4();
    let reservedCount = 0;
    let ids: string[] = [];

    while (reservedCount < amount) {
      // Find requested amount of messages without expiryDate or uuid
      ids = await collection
        .find({
          $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }],
          uuid: { $exists: false },
        })
        .limit(amount)
        .map(doc => doc._id)
        .toArray();

      // If no unassigned messages were found, break out
      if (ids.length === 0) {
        break;
      }

      // Try to reserve the requested amount of messages
      reservedCount += (await collection.updateMany(
        {
          _id: { $in: ids },
          $or: [{ expiryDate: null }, { expiryDate: { $lte: new Date() } }],
          uuid: { $exists: false },
        },
        { $set: { uuid } }
      )).modifiedCount;
    }

    // Fetch reserved ids
    const reservedIds = await collection
      .find({ uuid })
      .limit(amount)
      .map(doc => doc._id)
      .toArray();

    // Claim messages
    await collection.updateMany(
      { _id: { $in: reservedIds } },
      {
        $set: { expiryDate: DateUtil.getExpiryDate(expiresIn) },
        $unset: { uuid },
        $inc: { attempts: 1 },
      }
    );

    // Unclaim overload
    await collection.updateMany({ uuid }, { $unset: { uuid } });

    // Fetch and return claimed messages
    return (await collection.find({ _id: { $in: reservedIds } })).toArray();
  }

  static async pushOne(db: Db, queue: string, payload: Object, hashCode?: string, expiresIn?: number): Promise<number> {
    const collection = MessageQueue.collection(db, queue);

    if (!(await CommandHistory.shouldExecute(db, hashCode, expiresIn))) return 0;

    const insertedCount = await collection
      .insertOne({ payload })
      .then(result => result.insertedCount)
      .catch(() => CommandHistory.clearCommand(db, hashCode).then(() => 0));

    return insertedCount;
  }

  static async pushMany(
    db: Db,
    queue: string,
    payloads: Object[],
    hashCode?: string,
    expiresIn?: number
  ): Promise<number> {
    const collection = MessageQueue.collection(db, queue);

    if (!(await CommandHistory.shouldExecute(db, hashCode, expiresIn))) return 0;

    const insertedCount = await collection
      .insertMany(payloads.map(payload => ({ payload })), { ordered: false })
      .then(result => result.insertedCount)
      .catch(() => CommandHistory.clearCommand(db, hashCode).then(() => 0));

    return insertedCount;
  }

  static async size(db: Db, queue: string): Promise<number> {
    const collection = MessageQueue.collection(db, queue);

    return await collection.countDocuments();
  }

  private static collection(db: Db, queue: string): Collection {
    return db.collection(MessageQueue.QUEUE_PREFIX + queue);
  }
}
