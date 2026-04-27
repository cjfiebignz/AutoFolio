import { Injectable, Logger } from '@nestjs/common';
import { unlink, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async saveFile(file: Express.Multer.File): Promise<string> {
    // In local mode, Multer has already saved the file to the disk.
    // We return the filename as the storage key.
    return file.filename;
  }

  async deleteFile(storageKey: string): Promise<void> {
    const filePath = join(this.uploadDir, storageKey);
    try {
      if (await this.fileExists(storageKey)) {
        await unlink(filePath);
      }
    } catch (err) {
      this.logger.error(`Failed to delete file: ${storageKey}`, err);
    }
  }

  async fileExists(storageKey: string): Promise<boolean> {
    const filePath = join(this.uploadDir, storageKey);
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(storageKey: string): string {
    // Preserve current /uploads/ URL structure for frontend compatibility
    return `/uploads/${storageKey}`;
  }

  getFilePath(storageKey: string): string {
    return join(this.uploadDir, storageKey);
  }
}
