import type { DocumentStore } from '../src/application/ports/DocumentStore.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
export class MemoryDocumentStore implements DocumentStore {
  readonly files = new Map<string,string>();
  failWrite = false;
  async read(path: string): Promise<{document: SvgDocument; warnings: readonly string[]}> {
    const text = this.files.get(path); if (text === undefined) throw new Error(`cannot read file: ${path}`);
    return new SvgCodec().decode(text);
  }
  async write(path: string, document: SvgDocument): Promise<void> {
    if (this.failWrite) throw new Error(`cannot write file: ${path}`);
    this.files.set(path, new SvgCodec().encode(document));
  }
}
