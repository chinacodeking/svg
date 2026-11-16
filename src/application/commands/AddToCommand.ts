import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class AddToCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(2);
  }
  apply(document: SvgDocument): string {
    document.addTo(this.args.at(0), this.args.at(1));
    return `${document.find(this.args.at(1)).label} added to g#${this.args.at(0)}`;
  }
}
