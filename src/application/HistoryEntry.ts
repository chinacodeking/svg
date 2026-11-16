import { SvgDocument } from '../domain/SvgDocument.js';
export class HistoryEntry {
  constructor(private readonly before: SvgDocument, private readonly after: SvgDocument, private readonly description: string) {}
  undo(): { document: SvgDocument; message: string } { return {document: this.before.clone(), message: `undone: ${this.description}`}; }
  redo(): { document: SvgDocument; message: string } { return {document: this.after.clone(), message: `redone: ${this.description}`}; }
}
