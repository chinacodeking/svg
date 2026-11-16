import { Command } from "./Command.js";
import { Arguments } from "../Arguments.js";
import { DocumentPresenter } from "../DocumentPresenter.js";
import type { EditorSession } from "../EditorSession.js";
export class TreeCommand extends Command {
  constructor(private readonly args: Arguments) {
    super();
    args.check(0, 1);
  }
  async execute(session: EditorSession): Promise<string[]> {
    return new DocumentPresenter().tree(
      session.document(),
      this.args.optional(0),
    );
  }
}
