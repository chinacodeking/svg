import type { Shape } from "./Shape.js";
export interface ShapeParent {
  readonly label: string;
  readonly parent: ShapeParent | null;
  children(): readonly Shape[];
  insert(shape: Shape, index?: number): void;
  remove(shape: Shape): void;
}
