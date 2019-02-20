export class DateUtils {
  private static readonly DEFAULT_MESSAGE_EXPIRY: number = 300;

  static getExpiryDate(expiresIn?: number): Date {
    expiresIn = expiresIn || this.DEFAULT_MESSAGE_EXPIRY;

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    return expiryDate;
  }
}
