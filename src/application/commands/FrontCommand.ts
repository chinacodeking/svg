import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class FrontCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(1);
  }
  apply(document: SvgDocument): string {
    document.reorder(this.args.at(0), true);
    return `${document.find(this.args.at(0)).label} moved to front`;
  }
}
