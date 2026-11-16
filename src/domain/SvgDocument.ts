import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { ChildList } from './ChildList.js';
import { Numeric } from './Numeric.js';
import type { ShapeParent } from './ShapeParent.js';
export class SvgDocument implements ShapeParent {
  readonly label = 'svg';
  readonly parent = null;
  private readonly nodes = new ChildList(this);
  private extras = new Map<string, string>();
  constructor(private w = 800, private h = 600) { this.resize(w, h); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  resize(w: number, h: number): void { Numeric.positive(w, 'width'); Numeric.positive(h, 'height'); this.w = w; this.h = h; }
  preserve(key: string, value: string): void { this.extras.set(key, value); }
  attributes(): Readonly<Record<string, string>> { return Object.fromEntries(this.extras); }
  children(): readonly Shape[] { return this.nodes.all(); }
  insert(shape: Shape, index?: number): void { this.nodes.insert(shape, index); }
  remove(shape: Shape): void { this.nodes.remove(shape); }
  all(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (parent: ShapeParent): void => { for (const child of parent.children()) { result.push(child); if (child.children().length) visit(child.asContainer()); } };
    visit(this); return result;
  }
  find(id: string): Shape { const result = this.all().find(shape => shape.id === id); if (!result) throw new Error(`no such shape: ${id}`); return result; }
  container(id: string): ShapeParent {
    const result = this.all().find(shape => shape.id === id);
    if (!result) throw new Error(`no such container: ${id}`);
    return result.asContainer();
  }
  assertUnused(id: string): void { if (this.all().some(shape => shape.id === id) || this.extras.get('id') === id) throw new Error(`id already exists: ${id}`); }
  add(shape: Shape, parent: ShapeParent = this): void { this.assertUnused(shape.id); parent.insert(shape); }
  delete(id: string): Shape { const shape = this.find(id); shape.parent!.remove(shape); return shape; }
  group(id: string, ids: readonly string[]): Group {
    this.assertUnused(id);
    if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group target');
    const selected = this.all().filter(shape => ids.includes(shape.id));
    ids.forEach(target => this.find(target));
    for (const shape of selected) {
      for (let parent = shape.parent; parent && parent !== this; parent = parent.parent) {
        const ancestor = selected.find(target => target === parent as unknown);
        if (ancestor) throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
      }
    }
    let common = selected[0]!.parent!;
    while (!selected.every(shape => this.isUnder(shape, common))) common = common.parent!;
    let branch: Shape = selected[0]!;
    while (branch.parent !== common) branch = branch.parent as Group;
    const index = common.children().indexOf(branch);
    const group = new Group(id);
    // Insert before detaching: keeps the anchor valid even when the first selection is a direct child.
    common.insert(group, index);
    for (const shape of selected) { shape.parent!.remove(shape); group.insert(shape); }
    return group;
  }
  private isUnder(shape: Shape, ancestor: ShapeParent): boolean {
    for (let parent = shape.parent; parent; parent = parent.parent) if (parent === ancestor) return true;
    return false;
  }
  ungroup(id: string): number {
    const shape = this.find(id); const container = shape.asContainer(); const parent = shape.parent!;
    if (parent === this) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.children().indexOf(shape); const children = container.children();
    // Materialize group presentation only when a child has no overriding value.
    for (const child of children) {
      const attrs = child.attributes();
      for (const [key, value] of Object.entries(shape.attributes())) {
        if (key !== 'id' && key !== 'data-kind' && attrs[key] === undefined) {
          if (['fill', 'stroke', 'stroke-width'].includes(key)) child.set(key, value);
          else child.preserve(key, value);
        }
      }
      container.remove(child);
    }
    parent.remove(shape); children.forEach((child, offset) => parent.insert(child, index + offset)); return children.length;
  }
  addTo(gid: string, id: string): void {
    const container = this.container(gid); const shape = this.find(id);
    for (let parent: ShapeParent | null = container; parent; parent = parent.parent) {
      if (parent === shape as unknown) throw new Error(`cannot move a container into its own descendant: ${id}`);
    }
    shape.parent!.remove(shape); container.insert(shape);
  }
  reorder(id: string, toFront: boolean): void {
    const shape = this.find(id); const parent = shape.parent!;
    parent.remove(shape); parent.insert(shape, toFront ? parent.children().length : 0);
  }
  clone(): SvgDocument {
    const result = new SvgDocument(this.w, this.h);
    this.extras.forEach((value, key) => result.preserve(key, value));
    this.children().forEach(child => result.insert(child.clone())); return result;
  }
  validate(): void {
    const ids = new Set<string>(); const rootId = this.extras.get('id'); if (rootId) ids.add(rootId);
    for (const shape of this.all()) {
      if (ids.has(shape.id)) throw new Error(`id already exists: ${shape.id}`);
      ids.add(shape.id);
      if (!shape.parent || !shape.parent.children().includes(shape)) throw new Error(`invalid parent: ${shape.id}`);
    }
  }
}
