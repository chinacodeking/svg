import { Command } from './Command.js';
import { Arguments } from '../Arguments.js';
import type { EditorSession } from '../EditorSession.js';
export class SaveCommand extends Command {
  constructor(private readonly args: Arguments) { super(); args.check(0, 1); }
  async execute(session: EditorSession): Promise<string[]> { return session.save(this.args.optional(0)); }
}
