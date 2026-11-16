import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export abstract class EditCommand extends Command {
  async execute(session: EditorSession): Promise<string[]> {
    return session.edit(this);
  }
  abstract apply(document: SvgDocument): string;
}
