import { SvgDocument } from "../domain/SvgDocument.js";
import { CommandHistory } from "./CommandHistory.js";
import type { DocumentStore } from "./ports/DocumentStore.js";
import type { EditCommand } from "./commands/EditCommand.js";
export class EditorSession {
  private current: SvgDocument | null = null;
  private filename: string | undefined;
  private readonly history = new CommandHistory();
  constructor(private readonly store: DocumentStore) {}
  document(): SvgDocument {
    if (!this.current)
      throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(w = 800, h = 600): string[] {
    const document = new SvgDocument(w, h);
    this.current = document;
    this.filename = undefined;
    this.history.barrier();
    return [`canvas ${w}x${h} created`];
  }
  async read(path: string): Promise<string[]> {
    const result = await this.store.read(path);
    result.document.validate();
    this.current = result.document;
    this.filename = path;
    this.history.barrier();
    return [
      ...result.warnings,
      `read ${path} (${result.document.all().length} elements)`,
    ];
  }
  async save(path?: string): Promise<string[]> {
    const document = this.document();
    const target = path ?? this.filename;
    if (!target) throw new Error("no file path. use save <file.svg>");
    await this.store.write(target, document);
    this.filename = target;
    this.history.barrier();
    return [`saved to ${target} (${document.all().length} elements)`];
  }
  canvas(width?: number, height?: number): string[] {
    const current = this.document();
    if (width === undefined)
      return [`canvas ${current.width}x${current.height}`];
    const candidate = current.clone();
    candidate.resize(width, height ?? current.height);
    this.current = candidate;
    this.history.barrier();
    return [`canvas resized to ${candidate.width}x${candidate.height}`];
  }
  edit(command: EditCommand): string[] {
    const before = this.document();
    const candidate = before.clone();
    const message = command.apply(candidate);
    candidate.validate();
    this.history.record(before, candidate, message);
    this.current = candidate;
    return [message];
  }
  undo(): string[] {
    this.document();
    const result = this.history.undo();
    this.current = result.document;
    return [result.message];
  }
  redo(): string[] {
    this.document();
    const result = this.history.redo();
    this.current = result.document;
    return [result.message];
  }
}
