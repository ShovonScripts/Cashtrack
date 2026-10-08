export class StorageParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageParseError';
  }
}
