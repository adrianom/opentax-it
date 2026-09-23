import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Local file storage (XML invoices, SDI receipts, attachments). Root from STORAGE_DIR (default: apps/api/storage, independent of the working directory). */
@Injectable()
export class StorageService {
  private readonly root = process.env.STORAGE_DIR
    ? resolve(process.env.STORAGE_DIR)
    : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'storage');

  /** With `exclusive` the write fails (EEXIST) instead of replacing an existing file. */
  async write(relativePath: string, content: string | Buffer, options: { exclusive?: boolean } = {}): Promise<string> {
    const full = join(this.root, relativePath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, { flag: options.exclusive ? 'wx' : 'w' });
    return relativePath;
  }

  read(relativePath: string): Promise<Buffer> {
    return readFile(join(this.root, relativePath));
  }
}
