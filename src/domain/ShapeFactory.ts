import { Shape } from "./Shape.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { TextShape } from "./TextShape.js";
import { Group } from "./Group.js";
import { Numeric } from "./Numeric.js";
type Definition = {
  geometry: readonly string[];
  text?: boolean;
  style?: string;
  build: (id: string, n: number[], text: string) => Shape;
};
/** The only shape-name dispatch point. Replace built-in registration with providers in the plugin phase. */
export class ShapeFactory {
  private readonly definitions = new Map<string, Definition>([
    [
      "rect",
      {
        geometry: ["x", "y", "width", "height"],
        style: "fill",
        build: (id, n) => new Rect(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "circle",
      {
        geometry: ["cx", "cy", "r"],
        style: "fill",
        build: (id, n) => new Circle(id, n[0]!, n[1]!, n[2]!),
      },
    ],
    [
      "ellipse",
      {
        geometry: ["cx", "cy", "rx", "ry"],
        style: "fill",
        build: (id, n) => new Ellipse(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "line",
      {
        geometry: ["x1", "y1", "x2", "y2"],
        style: "stroke",
        build: (id, n) => new Line(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "text",
      {
        geometry: ["x", "y"],
        text: true,
        build: (id, n, text) => new TextShape(id, n[0]!, n[1]!, text),
      },
    ],
    ["g", { geometry: [], build: (id) => new Group(id) }],
  ]);
  private definition(type: string): Definition {
    const definition = this.definitions.get(type);
    if (!definition)
      throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  create(type: string, id: string, params: readonly string[]): Shape {
    const d = this.definition(type);
    const count = d.geometry.length + (d.text ? 1 : 0);
    if (params.length < count || params.length > count + (d.style ? 1 : 0))
      throw new Error(`invalid parameters for ${type}`);
    const numbers = d.geometry.map((key, index) =>
      Numeric.parse(params[index]!, key),
    );
    const result = d.build(id, numbers, d.text ? params[count - 1]! : "");
    if (d.style && params[count] !== undefined)
      result.set(d.style, params[count]!);
    return result;
  }
  fromSvg(
    type: string,
    id: string,
    attrs: Readonly<Record<string, string>>,
    text: string,
  ): Shape {
    const d = this.definition(type);
    const result = d.build(
      id,
      d.geometry.map((key) => Numeric.parse(attrs[key] ?? "0", key)),
      text,
    );
    const presentation = new Set([
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "text-anchor",
      "dominant-baseline",
      "data-kind",
    ]);
    for (const [key, value] of Object.entries(attrs)) {
      if (
        ["id", "transform", "xmlns"].includes(key) ||
        d.geometry.includes(key)
      )
        continue;
      if (presentation.has(key)) {
        if (key === "font-size")
          Numeric.nonnegative(Numeric.parse(value, key), key);
        result.preserve(key, value);
      } else result.set(key, value);
    }
    return result;
  }
}
