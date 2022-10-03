import { Collection, Db, Document, Filter, ObjectId, UpdateFilter } from 'mongodb';
import { CryptoUtils } from './crypto-utils';

export class MongoUtils {
  static readonly QUEUE_PREFIX = 'queue-';

  static collection(db: Db, queue: string): Collection {
    return db.collection(MongoUtils.QUEUE_PREFIX + queue);
  }

  static async findAndUpdateMany(
    filter: Filter<Document>,
    update: UpdateFilter<Document>,
    limit: number,
    collection: Collection,
  ): Promise<Document[]> {
    const faum_uid = CryptoUtils.generateId();
    let reservedCount = 0;
    let ids: ObjectId[] = [];
    let reservedIds: ObjectId[] = [];

    try {
      while (reservedCount < limit) {
        // Find requested amount of messages without expiryDate or uuid
        ids = await collection
          .find({
            ...filter,
            faum_uid: { $exists: false },
          })
          .limit(limit)
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
            faum_uid: { $exists: false },
          },
          { $set: { faum_uid } },
        )).modifiedCount;
      }

      // Fetch reserved ids
      reservedIds = await collection
        .find({ faum_uid })
        .limit(limit)
        .map(doc => doc._id)
        .toArray();

      // Claim messages
      await collection.updateMany(
        { _id: { $in: reservedIds } },
        {
          ...update,
          $unset: { faum_uid },
        },
      );
    } catch (e) {}

    // Unclaim all
    await collection.updateMany({ faum_uid }, { $unset: { faum_uid } });

    // Fetch and return claimed messages
    return collection.find({ _id: { $in: reservedIds } }).toArray();
  }
}
