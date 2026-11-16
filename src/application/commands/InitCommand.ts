import { Command } from "./Command.js";
import { Arguments } from "../Arguments.js";
import type { EditorSession } from "../EditorSession.js";
export class InitCommand extends Command {
  constructor(private readonly args: Arguments) {
    super();
    args.check(0, 2);
  }
  async execute(session: EditorSession): Promise<string[]> {
    return session.init(
      this.args.optional(0) === undefined ? 800 : this.args.number(0),
      this.args.optional(1) === undefined ? 600 : this.args.number(1),
    );
  }
}
