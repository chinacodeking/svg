import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class GroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(2, Number.MAX_SAFE_INTEGER);
  }
  apply(document: SvgDocument): string {
    const shape = document.group(this.args.at(0), this.args.rest(1));
    return `${shape.label} created with ${shape.children().length} children`;
  }
}
