import { Shape } from "./Shape.js";
import { Numeric } from "./Numeric.js";
export abstract class GeometryShape extends Shape {
  private readonly values = new Map<string, number>();
  protected constructor(
    id: string,
    geometry: Readonly<Record<string, number>>,
    private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[],
    private readonly dimensions: readonly string[],
  ) {
    super(id);
    for (const [key, value] of Object.entries(geometry))
      this.assign(key, value);
  }
  private assign(key: string, value: number): void {
    this.values.set(
      key,
      this.dimensions.includes(key)
        ? Numeric.nonnegative(value, key)
        : Numeric.finite(value, key),
    );
  }
  protected value(key: string): number {
    return this.values.get(key)!;
  }
  override set(attribute: string, value: string): void {
    if (this.values.has(attribute))
      this.assign(attribute, Numeric.parse(value, attribute));
    else super.set(attribute, value);
  }
  override attributes(): Readonly<Record<string, string>> {
    return {
      ...super.attributes(),
      ...Object.fromEntries([...this.values].map(([k, v]) => [k, String(v)])),
    };
  }
  move(dx: number, dy: number): void {
    Numeric.finite(dx, "dx");
    Numeric.finite(dy, "dy");
    for (const key of this.xKeys) this.assign(key, this.value(key) + dx);
    for (const key of this.yKeys) this.assign(key, this.value(key) + dy);
  }
  scale(factor: number): void {
    Numeric.positive(factor, "scale factor");
    for (const [key, value] of this.values) this.assign(key, value * factor);
  }
  override position(): string {
    return `(${this.value(this.xKeys[0]!)},${this.value(this.yKeys[0]!)})`;
  }
  protected withStyles(geometry: string): string {
    return [this.label, geometry, this.styleSummary()]
      .filter(Boolean)
      .join(" ");
  }
}
