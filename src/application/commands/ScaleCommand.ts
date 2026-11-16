import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class ScaleCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(2);
  }
  apply(document: SvgDocument): string {
    const shape = document.find(this.args.at(0));
    const factor = this.args.number(1);
    shape.scale(factor);
    return `${shape.label} scaled by ${factor}`;
  }
}
