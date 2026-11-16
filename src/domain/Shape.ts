import { Numeric } from "./Numeric.js";
import type { ShapeParent } from "./ShapeParent.js";
export abstract class Shape {
  private owner: ShapeParent | null = null;
  private styles = new Map<string, string>();
  private preserved = new Map<string, string>();
  protected constructor(private readonly identifier: string) {
    if (!identifier || /[\s\u0000-\u001f]/u.test(identifier))
      throw new Error(`invalid id: ${identifier}`);
  }
  abstract readonly type: string;
  get id(): string {
    return this.identifier;
  }
  get label(): string {
    return `${this.type}#${this.id}`;
  }
  get parent(): ShapeParent | null {
    return this.owner;
  }
  attach(parent: ShapeParent | null): void {
    this.owner = parent;
  }
  children(): readonly Shape[] {
    return [];
  }
  asContainer(): ShapeParent {
    throw new Error(`not a container: ${this.id}`);
  }
  set(attribute: string, value: string): void {
    if (attribute === "stroke-width")
      Numeric.nonnegative(Numeric.parse(value, attribute), attribute);
    else if (attribute !== "fill" && attribute !== "stroke")
      throw new Error(`unknown attribute: ${attribute}`);
    this.styles.set(attribute, value);
  }
  preserve(attribute: string, value: string): void {
    this.preserved.set(attribute, value);
  }
  attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([
      ["id", this.id],
      ...this.preserved,
      ...this.styles,
    ]);
  }
  styleSummary(): string {
    return [...this.styles].map(([key, value]) => `${key}=${value}`).join(" ");
  }
  protected copyAppearance(target: Shape): void {
    for (const [key, value] of this.styles) target.set(key, value);
    for (const [key, value] of this.preserved) target.preserve(key, value);
  }
  content(): string | null {
    return null;
  }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract summary(): string;
  position(): string | null {
    return null;
  }
}
