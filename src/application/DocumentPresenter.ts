import type { SvgDocument } from "../domain/SvgDocument.js";
import type { Shape } from "../domain/Shape.js";
export class DocumentPresenter {
  tree(document: SvgDocument, id?: string): string[] {
    const root = id === undefined ? null : document.find(id);
    const lines = [
      root ? root.summary() : `svg (${document.width}x${document.height})`,
    ];
    this.append(root ? root.children() : document.children(), "", lines);
    return lines;
  }
  private append(
    children: readonly Shape[],
    prefix: string,
    lines: string[],
  ): void {
    children.forEach((shape, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${shape.summary()}`);
      this.append(shape.children(), prefix + (last ? "    " : "│   "), lines);
    });
  }
  show(document: SvgDocument, id: string): string[] {
    const shape = document.find(id);
    const lines = [`${shape.label}  parent=${shape.parent!.label}`];
    for (const [key, value] of Object.entries(shape.attributes()))
      if (key !== "id")
        lines.push(
          `  ${key}=${/\s/.test(value) ? JSON.stringify(value) : value}`,
        );
    const text = shape.content();
    if (text !== null) lines.push(`  text=${JSON.stringify(text)}`);
    return lines;
  }
}
