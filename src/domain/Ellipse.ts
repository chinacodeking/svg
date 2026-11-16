import { GeometryShape } from './GeometryShape.js';
export class Ellipse extends GeometryShape {
  readonly type = 'ellipse';
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, {cx, cy, rx, ry}, ["cx"], ["cy"], ["rx", "ry"]); }
  clone(): Ellipse { const result = new Ellipse(this.id, this.value("cx"), this.value("cy"), this.value("rx"), this.value("ry")); this.copyAppearance(result); return result; }
  summary(): string { return this.withStyles(`cx=${this.value("cx")} cy=${this.value("cy")} rx=${this.value("rx")} ry=${this.value("ry")}`); }
}
