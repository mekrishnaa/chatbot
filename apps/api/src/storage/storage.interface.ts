export interface StorageService {
  /**
   * Save a file from buffer or stream and return its stored relative/absolute path or key
   */
  saveFile(filename: string, buffer: Buffer, mimeType: string): Promise<string>;

  /**
   * Retrieve file content buffer by path/key
   */
  readFile(filePath: string): Promise<Buffer>;

  /**
   * Delete a stored file
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Check if file exists
   */
  fileExists(filePath: string): Promise<boolean>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

