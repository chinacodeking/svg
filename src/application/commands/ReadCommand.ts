import { Command } from "./Command.js";
import { Arguments } from "../Arguments.js";
import type { EditorSession } from "../EditorSession.js";
export class ReadCommand extends Command {
  constructor(private readonly args: Arguments) {
    super();
    args.check(1);
  }
  async execute(session: EditorSession): Promise<string[]> {
    return session.read(this.args.at(0));
  }
}
