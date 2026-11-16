import { Command } from './Command.js';
import { Arguments } from '../Arguments.js';
import type { EditorSession } from '../EditorSession.js';
export class CanvasCommand extends Command {
  constructor(private readonly args: Arguments) { super(); args.check(0, 2); }
  async execute(session: EditorSession): Promise<string[]> { return session.canvas(this.args.optional(0) === undefined ? undefined : this.args.number(0), this.args.optional(1) === undefined ? undefined : this.args.number(1)); }
}
