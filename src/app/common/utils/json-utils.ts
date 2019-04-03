export class JsonUtils {
  static tryParse(json: string | undefined, defaultValue: any): any {
    if (!json) return defaultValue;

    let value;
    try {
      value = JSON.parse(json);
    } catch (e) {
      value = defaultValue;
    }

    return value;
  }
}
