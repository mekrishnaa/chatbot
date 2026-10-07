import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements StorageService, OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private storageDir: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath = this.configService.get<string>(
      'STORAGE_PATH',
      '../../storage/documents',
    );
    this.storageDir = path.resolve(process.cwd(), configuredPath);
  }

  async onModuleInit() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      this.logger.log(`Initialized local file storage at: ${this.storageDir}`);
    } catch (err) {
      this.logger.error(`Failed to create storage directory: ${err.message}`);
    }
  }

  /**
   * Sanitizes filename and prevents directory traversal attacks.
   */
  private sanitizeFilename(filename: string): string {
    const base = path.basename(filename);
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async saveFile(
    filename: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<string> {
    const cleanName = this.sanitizeFilename(filename);
    const uniquePrefix = uuidv4();
    const storedFilename = `${uniquePrefix}-${cleanName}`;
    const destinationPath = path.join(this.storageDir, storedFilename);

    await fs.writeFile(destinationPath, buffer);
    this.logger.log(`Saved file to ${destinationPath}`);
    return destinationPath;
  }

  async readFile(filePath: string): Promise<Buffer> {
    // Prevent traversal outside storageDir
    const normalized = path.resolve(filePath);
    if (!normalized.startsWith(this.storageDir)) {
      throw new Error('Access denied: File outside storage directory');
    }
    return await fs.readFile(normalized);
  }

  async deleteFile(filePath: string): Promise<void> {
    const normalized = path.resolve(filePath);
    if (!normalized.startsWith(this.storageDir)) {
      throw new Error('Access denied: File outside storage directory');
    }
    try {
      await fs.unlink(normalized);
      this.logger.log(`Deleted file at ${normalized}`);
    } catch (err) {
      this.logger.warn(`Could not delete file ${normalized}: ${err.message}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

