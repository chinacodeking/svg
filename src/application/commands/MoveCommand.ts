import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class MoveCommand extends EditCommand {
  constructor(private readonly args: Arguments) {
    super();
    args.check(3);
  }
  apply(document: SvgDocument): string {
    const shape = document.find(this.args.at(0));
    const dx = this.args.number(1);
    const dy = this.args.number(2);
    shape.move(dx, dy);
    return `${shape.label} moved ${shape.position() ? `to ${shape.position()}` : `by (${dx},${dy})`}`;
  }
}
