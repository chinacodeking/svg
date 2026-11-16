import { GeometryShape } from "./GeometryShape.js";
export class TextShape extends GeometryShape {
  readonly type = "text";
  constructor(
    id: string,
    x: number,
    y: number,
    private text: string,
  ) {
    super(id, { x, y }, ["x"], ["y"], []);
  }
  override content(): string {
    return this.text;
  }
  override set(attribute: string, value: string): void {
    if (attribute === "text") this.text = value;
    else super.set(attribute, value);
  }
  clone(): TextShape {
    const result = new TextShape(
      this.id,
      this.value("x"),
      this.value("y"),
      this.text,
    );
    this.copyAppearance(result);
    return result;
  }
  summary(): string {
    return this.withStyles(`${this.position()} ${JSON.stringify(this.text)}`);
  }
}
