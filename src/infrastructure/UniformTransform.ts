import { Numeric } from "../domain/Numeric.js";
export class UniformTransform {
  constructor(
    readonly factor = 1,
    readonly dx = 0,
    readonly dy = 0,
  ) {
    Numeric.positive(factor, "scale factor");
    Numeric.finite(dx, "translate x");
    Numeric.finite(dy, "translate y");
  }
  combine(local: UniformTransform): UniformTransform {
    return new UniformTransform(
      this.factor * local.factor,
      this.dx + this.factor * local.dx,
      this.dy + this.factor * local.dy,
    );
  }
  static parse(source: string): UniformTransform {
    let result = new UniformTransform();
    let rest = source.trim();
    while (rest) {
      const match = /^(translate|scale)\s*\(([^()]*)\)/.exec(rest);
      if (!match) throw new Error(`unsupported transform: ${source}`);
      const raw = match[2]!.trim();
      if (!raw || /^,|,$|,\s*,/.test(raw))
        throw new Error(`invalid transform: ${source}`);
      const values = raw
        .split(/[\s,]+/)
        .map((value) => Numeric.parse(value, "transform"));
      if (values.length < 1 || values.length > 2)
        throw new Error(`invalid transform: ${source}`);
      if (match[1] === "translate")
        result = result.combine(
          new UniformTransform(1, values[0]!, values[1] ?? 0),
        );
      else {
        if (values[1] !== undefined && values[1] !== values[0])
          throw new Error(`unsupported non-uniform scale: ${source}`);
        result = result.combine(new UniformTransform(values[0]!));
      }
      rest = rest.slice(match[0].length).trimStart();
      if (rest.startsWith(",")) {
        rest = rest.slice(1).trimStart();
        if (!rest) throw new Error(`invalid transform: ${source}`);
      }
    }
    return result;
  }
}
