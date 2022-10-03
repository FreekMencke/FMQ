import { randomBytes } from 'crypto';

export class CryptoUtils {

  static generateId(): string {
    return randomBytes(20).toString('hex');
  }

}
