import fs from 'fs';
import path from 'path';
import os from 'os';

export class PdfArtifactManager {
  private tempDirectory: string;

  constructor(customTempDir?: string) {
    this.tempDirectory = customTempDir || path.join(os.tmpdir(), 'the-fynence-pdf');
    this.ensureTempDirectory();
  }

  /**
   * Ensures the temporary artifact directory exists.
   */
  public ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }

  /**
   * Gets absolute path for an artifact in the managed temp directory.
   */
  public getArtifactPath(fileName: string): string {
    return path.join(this.tempDirectory, path.basename(fileName));
  }

  /**
   * Writes PDF buffer to a temporary file artifact.
   */
  public async writeTempPdf(fileName: string, buffer: Buffer): Promise<string> {
    this.ensureTempDirectory();
    const filePath = this.getArtifactPath(fileName);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Cleans up a specific temporary artifact file.
   * Returns true if file was removed or already did not exist.
   */
  public async cleanupArtifact(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleans up all temporary PDF files in the managed temp directory.
   * Returns the count of deleted files.
   */
  public async cleanupAll(): Promise<number> {
    try {
      if (!fs.existsSync(this.tempDirectory)) return 0;
      const files = await fs.promises.readdir(this.tempDirectory);
      let deleted = 0;
      for (const file of files) {
        if (file.toLowerCase().endsWith('.pdf') || file.toLowerCase().endsWith('.png')) {
          await fs.promises.unlink(path.join(this.tempDirectory, file));
          deleted++;
        }
      }
      return deleted;
    } catch {
      return 0;
    }
  }

  public getDirectory(): string {
    return this.tempDirectory;
  }
}

export const defaultPdfArtifactManager = new PdfArtifactManager();
