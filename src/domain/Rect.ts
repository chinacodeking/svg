import { GeometryShape } from "./GeometryShape.js";
export class Rect extends GeometryShape {
  readonly type = "rect";
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ["x"], ["y"], ["width", "height"]);
  }
  clone(): Rect {
    const result = new Rect(
      this.id,
      this.value("x"),
      this.value("y"),
      this.value("width"),
      this.value("height"),
    );
    this.copyAppearance(result);
    return result;
  }
  summary(): string {
    return this.withStyles(
      `x=${this.value("x")} y=${this.value("y")} w=${this.value("width")} h=${this.value("height")}`,
    );
  }
}
