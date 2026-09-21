import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/** Local file storage (XML invoices, SDI receipts, attachments). Root from STORAGE_DIR (default ./storage). */
@Injectable()
export class StorageService {
  private readonly root = resolve(process.env.STORAGE_DIR ?? './storage');

  async write(relativePath: string, content: string | Buffer): Promise<string> {
    const full = join(this.root, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
    return relativePath;
  }

  read(relativePath: string): Promise<Buffer> {
    return readFile(join(this.root, relativePath));
  }
}
