import { DOMParser, XMLSerializer, DOMImplementation } from "@xmldom/xmldom";
import { SvgDocument } from "../domain/SvgDocument.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeParent } from "../domain/ShapeParent.js";
import { Numeric } from "../domain/Numeric.js";
import { UniformTransform } from "./UniformTransform.js";
export class SvgCodec {
  private readonly namespace = "http://www.w3.org/2000/svg";
  constructor(private readonly factory = new ShapeFactory()) {}
  decode(source: string): { document: SvgDocument; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source))
      throw new Error("unsupported XML declaration: DTD/entities");
    const failures: string[] = [];
    const xml = new DOMParser({
      errorHandler: {
        warning: (message) => failures.push(message),
        error: (message) => failures.push(message),
        fatalError: (message) => failures.push(message),
      },
    }).parseFromString(source, "application/xml");
    if (failures.length || !xml.documentElement)
      throw new Error("invalid SVG XML");
    const root = xml.documentElement;
    if (
      root.localName !== "svg" ||
      (root.namespaceURI && root.namespaceURI !== this.namespace)
    )
      throw new Error("expected SVG root element");
    for (const node of Array.from(xml.childNodes))
      if (
        node !== root &&
        node.nodeType !== 7 &&
        node.nodeType !== 8 &&
        !(node.nodeType === 3 && !node.nodeValue?.trim())
      )
        throw new Error("invalid SVG XML");
    const attrs = this.attributes(root);
    const document = new SvgDocument(
      Numeric.parse(attrs.width ?? "800", "width"),
      Numeric.parse(attrs.height ?? "600", "height"),
    );
    if (attrs.viewBox !== undefined) {
      const parts = attrs.viewBox
        .trim()
        .split(/[\s,]+/)
        .map((value) => Numeric.parse(value, "viewBox"));
      if (
        parts.length !== 4 ||
        parts[0] !== 0 ||
        parts[1] !== 0 ||
        parts[2] !== document.width ||
        parts[3] !== document.height
      )
        throw new Error("unsupported viewBox: expected 0 0 width height");
    }
    const rootPresentation = new Set([
      "id",
      "fill",
      "stroke",
      "stroke-width",
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "text-anchor",
      "dominant-baseline",
    ]);
    for (const [key, value] of Object.entries(attrs)) {
      if (["xmlns", "width", "height", "viewBox", "version"].includes(key))
        continue;
      if (!rootPresentation.has(key))
        throw new Error(`unsupported SVG root attribute: ${key}`);
      if (["stroke-width", "font-size"].includes(key))
        Numeric.nonnegative(Numeric.parse(value, key), key);
      document.preserve(key, value);
    }
    const used = new Set<string>();
    for (const element of [
      root,
      ...Array.from(root.getElementsByTagName("*")),
    ]) {
      const id = element.getAttribute("id");
      if (!id) continue;
      if (used.has(id)) throw new Error(`id already exists: ${id}`);
      used.add(id);
    }
    const warnings: string[] = [];
    const counts = new Map<string, number>();
    this.readChildren(
      root,
      document,
      new UniformTransform(),
      attrs,
      used,
      counts,
      warnings,
    );
    document.validate();
    return { document, warnings };
  }
  private attributes(element: Element): Record<string, string> {
    return Object.fromEntries(
      Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
    );
  }
  private readChildren(
    element: Element,
    parent: ShapeParent,
    transform: UniformTransform,
    inherited: Readonly<Record<string, string>>,
    used: Set<string>,
    counts: Map<string, number>,
    warnings: string[],
  ): void {
    for (const node of Array.from(element.childNodes)) {
      if (
        node.nodeType === 8 ||
        (node.nodeType === 3 && !node.nodeValue?.trim())
      )
        continue;
      if (node.nodeType !== 1)
        throw new Error(`unsupported content in <${element.localName}>`);
      const child = node as Element;
      if (child.namespaceURI && child.namespaceURI !== this.namespace)
        throw new Error(`unsupported namespace: ${child.namespaceURI}`);
      const attrs = this.attributes(child);
      const type = child.localName;
      let id = attrs.id;
      if (!id) {
        let count = counts.get(type) ?? 0;
        do {
          id = `${type}${++count}`;
        } while (used.has(id));
        counts.set(type, count);
        used.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.factory.fromSvg(
        type,
        id,
        attrs,
        child.textContent ?? "",
      );
      const local = transform.combine(
        UniformTransform.parse(attrs.transform ?? ""),
      );
      const styles = { ...inherited, ...attrs };
      if (shape.content() !== null) {
        for (const part of Array.from(child.childNodes))
          if (![3, 4, 8].includes(part.nodeType))
            throw new Error("unsupported nested text content");
        shape.scale(local.factor);
        shape.move(local.dx, local.dy);
        if (local.factor !== 1)
          shape.preserve(
            "font-size",
            String(
              Numeric.nonnegative(
                Numeric.parse(styles["font-size"] ?? "16", "font-size") *
                  local.factor,
                "font-size",
              ),
            ),
          );
      } else {
        const elements = Array.from(child.childNodes).filter(
          (part) => part.nodeType === 1,
        );
        // Container capability is polymorphic; no tag-name dispatch outside the factory.
        if (elements.length || child.childNodes.length) {
          const meaningful = Array.from(child.childNodes).some(
            (part) =>
              part.nodeType !== 8 &&
              !(part.nodeType === 3 && !part.nodeValue?.trim()),
          );
          if (meaningful)
            this.readChildren(
              child,
              shape.asContainer(),
              local,
              styles,
              used,
              counts,
              warnings,
            );
        }
        // Empty groups accept these calls too, but descendants have already been transformed.
        if (!shape.children().length) {
          shape.scale(local.factor);
          shape.move(local.dx, local.dy);
        }
      }
      if (local.factor !== 1 && !shape.children().length)
        shape.set(
          "stroke-width",
          String(
            Numeric.nonnegative(
              Numeric.parse(styles["stroke-width"] ?? "1", "stroke-width") *
                local.factor,
              "stroke-width",
            ),
          ),
        );
      parent.insert(shape);
    }
  }
  encode(document: SvgDocument): string {
    document.validate();
    const xml = new DOMImplementation().createDocument(
      this.namespace,
      "svg",
      null,
    );
    const root = xml.documentElement;
    for (const [key, value] of Object.entries({
      xmlns: this.namespace,
      width: String(document.width),
      height: String(document.height),
      viewBox: `0 0 ${document.width} ${document.height}`,
      ...document.attributes(),
    }))
      root.setAttribute(key, value);
    for (const shape of document.children())
      root.appendChild(this.writeShape(xml, shape));
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(xml) +
      "\n"
    );
  }
  private writeShape(xml: Document, shape: Shape): Element {
    const node = xml.createElementNS(this.namespace, shape.type);
    for (const [key, value] of Object.entries(shape.attributes()))
      node.setAttribute(key, value);
    const text = shape.content();
    if (text !== null) node.appendChild(xml.createTextNode(text));
    for (const child of shape.children())
      node.appendChild(this.writeShape(xml, child));
    return node;
  }
}
