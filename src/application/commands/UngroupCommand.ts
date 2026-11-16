import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class UngroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(1);
  }
  apply(document: SvgDocument): string {
    const count = document.ungroup(this.args.at(0));
    return `g#${this.args.at(0)} ungrouped (${count} children promoted)`;
  }
}
