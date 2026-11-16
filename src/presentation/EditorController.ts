import { CommandFactory } from '../application/CommandFactory.js';
import { EditorSession } from '../application/EditorSession.js';
import { Tokenizer } from './Tokenizer.js';
export class EditorController {
  constructor(private readonly session: EditorSession, private readonly factory = new CommandFactory(), private readonly tokenizer = new Tokenizer()) {}
  async execute(line: string): Promise<{lines: string[]; failed: boolean}> {
    try {
      const tokens = this.tokenizer.tokenize(line); if (!tokens.length) return {lines: [], failed: false};
      return {lines: await this.factory.create(tokens).execute(this.session), failed: false};
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {lines: [`error: ${message.replace(/[\r\n]+/g, ' ')}`], failed: true};
    }
  }
}
