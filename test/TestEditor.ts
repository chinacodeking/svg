import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.js';
import { EditorController } from '../src/presentation/EditorController.js';
import { MemoryDocumentStore } from './MemoryDocumentStore.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
export class TestEditor {
  readonly store = new MemoryDocumentStore();
  readonly session = new EditorSession(this.store);
  readonly controller = new EditorController(this.session);
  async ok(line: string): Promise<string> { const result = await this.controller.execute(line); assert.equal(result.failed, false, result.lines.join('\n')); return result.lines.join('\n'); }
  async error(line: string, expected: string): Promise<void> { const result = await this.controller.execute(line); assert.equal(result.failed, true, line); assert.equal(result.lines.join('\n'), `error: ${expected}`); }
  snapshot(): string { return new SvgCodec().encode(this.session.document()); }
  async run(...lines: string[]): Promise<void> { for (const line of lines) await this.ok(line); }
}
