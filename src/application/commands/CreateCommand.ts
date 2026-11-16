import { EditCommand } from "./EditCommand.js";
import { Arguments } from "../Arguments.js";
import { ShapeFactory } from "../../domain/ShapeFactory.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class CreateCommand extends EditCommand {
  constructor(
    private readonly args: Arguments,
    private readonly factory: ShapeFactory,
  ) {
    super();
    args.check(2, Number.MAX_SAFE_INTEGER);
  }
  apply(document: SvgDocument): string {
    let params = [...this.args.rest(2)];
    let parent = document as import("../../domain/ShapeParent.js").ShapeParent;
    if (params.length >= 2 && params.at(-2) === "in") {
      parent = document.container(params.at(-1)!);
      params = params.slice(0, -2);
    }
    const shape = this.factory.create(this.args.at(0), this.args.at(1), params);
    document.add(shape, parent);
    return `${shape.label} created${parent === document ? "" : ` in ${parent.label}`}`;
  }
}
