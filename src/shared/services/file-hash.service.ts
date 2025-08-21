import { createHash } from 'crypto';

export class FileHashService {
  static calculateHash(buffer: Buffer, algorithm: 'sha256' | 'md5' = 'sha256'): string {
    return createHash(algorithm).update(buffer).digest('hex');
  }

  static getFileInfo(buffer: Buffer): { hash: string; size: number } {
    return {
      hash: this.calculateHash(buffer),
      size: buffer.length
    };
  }
}