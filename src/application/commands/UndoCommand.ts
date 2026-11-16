import { Command } from './Command.js';
import { Arguments } from '../Arguments.js';
import type { EditorSession } from '../EditorSession.js';
export class UndoCommand extends Command {
  constructor(private readonly args: Arguments) { super(); args.check(0); }
  async execute(session: EditorSession): Promise<string[]> { return session.undo(); }
}
