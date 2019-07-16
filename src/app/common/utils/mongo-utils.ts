import { Collection, Db } from 'mongodb';
import { v4 as uuidV4 } from 'uuid';

export class MongoUtils {
  static readonly QUEUE_PREFIX = 'queue-';

  static collection(db: Db, queue: string): Collection {
    return db.collection(MongoUtils.QUEUE_PREFIX + queue);
  }

  static async findAndUpdateMany(
    find: Object,
    update: Object,
    limit: number,
    collection: Collection,
  ): Promise<Object[]> {
    const _uuid = uuidV4();
    let reservedCount = 0;
    let ids: string[] = [];
    let reservedIds: string[] = [];

    try {
      while (reservedCount < limit) {
        // Find requested amount of messages without expiryDate or uuid
        ids = await collection
          .find({
            ...find,
            _uuid: { $exists: false },
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
            _uuid: { $exists: false },
          },
          { $set: { _uuid } },
        )).modifiedCount;
      }

      // Fetch reserved ids
      reservedIds = await collection
        .find({ _uuid })
        .limit(limit)
        .map(doc => doc._id)
        .toArray();

      // Claim messages
      await collection.updateMany(
        { _id: { $in: reservedIds } },
        {
          ...update,
          $unset: { _uuid },
        },
      );
    } catch (e) {}

    // Unclaim all
    await collection.updateMany({ _uuid }, { $unset: { _uuid } });

    // Fetch and return claimed messages
    return (await collection.find({ _id: { $in: reservedIds } })).toArray();
  }
}
