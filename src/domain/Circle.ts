import { GeometryShape } from "./GeometryShape.js";
export class Circle extends GeometryShape {
  readonly type = "circle";
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ["cx"], ["cy"], ["r"]);
  }
  clone(): Circle {
    const result = new Circle(
      this.id,
      this.value("cx"),
      this.value("cy"),
      this.value("r"),
    );
    this.copyAppearance(result);
    return result;
  }
  summary(): string {
    return this.withStyles(
      `cx=${this.value("cx")} cy=${this.value("cy")} r=${this.value("r")}`,
    );
  }
}
