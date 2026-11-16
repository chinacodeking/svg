import { HistoryEntry } from './HistoryEntry.js';
import { SvgDocument } from '../domain/SvgDocument.js';
export class CommandHistory {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private blocked = true;
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  record(before: SvgDocument, after: SvgDocument, message: string): void {
    this.past.push(new HistoryEntry(before.clone(), after.clone(), message)); this.future = []; this.blocked = false;
  }
  undo(): { document: SvgDocument; message: string } {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const entry = this.past.at(-1); if (!entry) throw new Error('nothing to undo');
    const result = entry.undo(); this.past.pop(); this.future.push(entry); return result;
  }
  redo(): { document: SvgDocument; message: string } {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const entry = this.future.at(-1); if (!entry) throw new Error('nothing to redo');
    const result = entry.redo(); this.future.pop(); this.past.push(entry); return result;
  }
}
