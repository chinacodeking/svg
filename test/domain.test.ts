import test from "node:test";
import assert from "node:assert/strict";
import { SvgDocument } from "../src/domain/SvgDocument.js";
import { ShapeFactory } from "../src/domain/ShapeFactory.js";
import { Rect } from "../src/domain/Rect.js";
import { Group } from "../src/domain/Group.js";

test("Composite moves/scales nested geometry and independent snapshots", () => {
  const doc = new SvgDocument();
  const group = new Group("scene");
  const inner = new Group("nested");
  doc.add(group);
  doc.add(inner, group);
  doc.add(new Rect("r", 10, 20, 30, 40), inner);
  const before = doc.clone();
  group.move(5, -2);
  group.scale(2);
  assert.deepEqual(doc.find("r").attributes(), {
    id: "r",
    x: "30",
    y: "36",
    width: "60",
    height: "80",
  });
  assert.equal(before.find("r").attributes().x, "10");
  doc.validate();
});

test("group uses document order and lowest common ancestor", () => {
  const doc = new SvgDocument();
  const a = new Group("a");
  const b = new Group("b");
  doc.add(a);
  doc.add(b);
  doc.add(new Rect("r1", 0, 0, 1, 1), a);
  doc.add(new Rect("r2", 1, 1, 1, 1), b);
  const grouped = doc.group("both", ["r2", "r1"]);
  assert.equal(grouped.parent, doc);
  assert.deepEqual(
    doc.children().map((s) => s.id),
    ["both", "a", "b"],
  );
  assert.deepEqual(
    grouped.children().map((s) => s.id),
    ["r1", "r2"],
  );
  doc.validate();
});

test("cycle rejection, top-level ungroup, nested promotion and z-order", () => {
  const doc = new SvgDocument();
  const a = new Group("a");
  const b = new Group("b");
  doc.add(a);
  doc.add(b, a);
  doc.add(new Rect("r", 0, 0, 1, 1), b);
  assert.throws(() => doc.group("bad", ["a", "r"]), /cannot group.*a/);
  assert.throws(() => doc.addTo("b", "a"), /cannot move/);
  assert.throws(() => doc.ungroup("a"), /top-level/);
  assert.equal(doc.ungroup("b"), 1);
  assert.equal(doc.find("r").parent, a);
  doc.add(new Rect("s", 0, 0, 1, 1), a);
  doc.reorder("r", true);
  assert.deepEqual(
    a.children().map((s) => s.id),
    ["s", "r"],
  );
  doc.reorder("r", false);
  assert.deepEqual(
    a.children().map((s) => s.id),
    ["r", "s"],
  );
});

test("six built-ins, case-sensitive IDs and numeric/attribute rules", () => {
  const factory = new ShapeFactory();
  const doc = new SvgDocument();
  for (const [type, args] of [
    ["rect", ["0", "0", "1", "2"]],
    ["circle", ["0", "0", "3"]],
    ["ellipse", ["0", "0", "2", "3"]],
    ["line", ["0", "1", "2", "3"]],
    ["text", ["0", "0", "hello"]],
    ["g", []],
  ] as const)
    doc.add(factory.create(type, type, args));
  assert.equal(doc.all().length, 6);
  doc.add(new Group("G"));
  assert.throws(() => doc.add(new Group("g")), /id already exists/);
  assert.throws(() => factory.create("box", "box", []), /unknown shape type/);
  assert.throws(
    () => factory.create("rect", "bad", ["0", "0", "-1", "3"]),
    /non-negative/,
  );
  assert.throws(
    () => doc.find("rect").set("text", "oops"),
    /unknown attribute: text/,
  );
  assert.throws(() => doc.find("g").scale(0), /scale factor must be positive/);
  assert.throws(
    () => factory.create("circle", "bad", ["NaN", "0", "1"]),
    /invalid number/,
  );
  assert.equal(doc.find("rect").attributes().fill, undefined);
});
