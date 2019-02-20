import chalk from 'chalk';

export class Logger {
  static log(...message: any[]): void {
    console.log(`[${Logger.getFormattedTime()}]`, ...message);
  }

  static logSuccess(...message: any[]): void {
    Logger.log(chalk.green(message.reduce((a, b) => `${a} ${b}`)));
  }

  static logWarning(...message: any[]): void {
    Logger.log(chalk.yellow(message.reduce((a, b) => `${a} ${b}`)));
  }

  static logError(...message: any[]): void {
    Logger.log(chalk.red(message.reduce((a, b) => `${a} ${b}`)));
  }

  static logTask(name: string, ...message: any[]): void {
    Logger.log(`${name}:`, ...message);
  }

  static logTaskSuccess(name: string, ...message: any[]): void {
    Logger.logSuccess(`${name}:`, ...message);
  }

  static logTaskWarning(name: string, ...message: any[]): void {
    Logger.logWarning(`${name}:`, ...message);
  }

  static logTaskError(name: string, ...message: any[]): void {
    Logger.logError(`${name}:`, ...message);
  }

  private static getFormattedTime(includeDate: boolean = true): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    };
    const date = new Date();
    const timeString = date.toLocaleTimeString('en-US', options);
    const dateString = `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    return includeDate ? `${dateString} ${timeString}` : timeString;
  }
}
