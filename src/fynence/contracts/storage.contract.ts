export interface TemporaryFileMetadata {
  fileKey: string;
  storageUri: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
  expiresAt: string;
}

export interface INewspaperStorageService {
  /**
   * Stores a temporary generated broadsheet binary (WebP or PDF) in InsForge Storage or ephemeral disk.
   */
  storeTemporaryEdition(
    editionId: string,
    filename: string,
    buffer: Uint8Array,
    ttlMinutes?: number
  ): Promise<TemporaryFileMetadata>;

  /**
   * Retrieves temporary file buffer if still within retention period.
   */
  getTemporaryFile(fileKey: string): Promise<Uint8Array | null>;

  /**
   * Removes temporary file once dispatched to Telegram.
   */
  deleteTemporaryFile(fileKey: string): Promise<boolean>;

  /**
   * Cleans up expired temporary newspaper files according to retention policy.
   */
  purgeExpiredFiles(maxAgeMinutes?: number): Promise<number>;
}
