import { Shape } from "./Shape.js";
import { ChildList } from "./ChildList.js";
import { Numeric } from "./Numeric.js";
import type { ShapeParent } from "./ShapeParent.js";
export class Group extends Shape implements ShapeParent {
  readonly type = "g";
  private readonly nodes = new ChildList(this);
  constructor(id: string) {
    super(id);
  }
  override children(): readonly Shape[] {
    return this.nodes.all();
  }
  override asContainer(): ShapeParent {
    return this;
  }
  insert(shape: Shape, index?: number): void {
    this.nodes.insert(shape, index);
  }
  remove(shape: Shape): void {
    this.nodes.remove(shape);
  }
  move(dx: number, dy: number): void {
    Numeric.finite(dx, "dx");
    Numeric.finite(dy, "dy");
    this.children().forEach((child) => child.move(dx, dy));
  }
  scale(factor: number): void {
    Numeric.positive(factor, "scale factor");
    this.children().forEach((child) => child.scale(factor));
  }
  clone(): Group {
    const result = new Group(this.id);
    this.copyAppearance(result);
    this.children().forEach((child) => result.insert(child.clone()));
    return result;
  }
  summary(): string {
    return [this.label, this.styleSummary()].filter(Boolean).join(" ");
  }
}
