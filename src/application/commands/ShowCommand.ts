import { Command } from "./Command.js";
import { Arguments } from "../Arguments.js";
import { DocumentPresenter } from "../DocumentPresenter.js";
import type { EditorSession } from "../EditorSession.js";
export class ShowCommand extends Command {
  constructor(private readonly args: Arguments) {
    super();
    args.check(1);
  }
  async execute(session: EditorSession): Promise<string[]> {
    return new DocumentPresenter().show(session.document(), this.args.at(0));
  }
}
