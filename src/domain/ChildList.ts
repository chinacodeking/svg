import type { Shape } from './Shape.js';
import type { ShapeParent } from './ShapeParent.js';
export class ChildList {
  private items: Shape[] = [];
  constructor(private readonly owner: ShapeParent) {}
  all(): readonly Shape[] { return [...this.items]; }
  insert(shape: Shape, index = this.items.length): void {
    if (shape.parent) throw new Error(`shape already attached: ${shape.id}`);
    for (let parent: ShapeParent | null = this.owner; parent; parent = parent.parent) {
      if (parent === shape as unknown) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    }
    if (!Number.isInteger(index) || index < 0 || index > this.items.length) throw new Error('invalid child index');
    this.items.splice(index, 0, shape); shape.attach(this.owner);
  }
  remove(shape: Shape): void {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.items.splice(index, 1); shape.attach(null);
  }
}
