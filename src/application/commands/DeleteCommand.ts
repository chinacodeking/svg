import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class DeleteCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(1);
  }
  apply(document: SvgDocument): string {
    return `${document.delete(this.args.at(0)).label} deleted`;
  }
}
