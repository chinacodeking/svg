import test from 'node:test';
import assert from 'node:assert/strict';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { TestEditor } from './TestEditor.js';

test('missing IDs reserve explicit IDs anywhere in tree before assigning', () => {
  const result = new SvgCodec().decode('<svg width="400" height="300"><rect/><g><rect id="rect1"/><circle/></g><rect/><circle id="circle1"/></svg>');
  assert.deepEqual(result.document.all().map(s => s.id),['rect2','g1','rect1','circle2','rect3','circle1']);
  assert.deepEqual(result.warnings,['warning: assigned id rect2 to unnamed <rect>','warning: assigned id g1 to unnamed <g>','warning: assigned id circle2 to unnamed <circle>','warning: assigned id rect3 to unnamed <rect>']);
});

test('SVG round trip preserves six shapes, nested groups, Unicode and XML escaping', async () => {
  const e = new TestEditor(); await e.run('init 400 300','create g root','create rect r 1 2 3 4 red in root','create circle c 1 2 3','create ellipse e 1 2 3 4','create line l 1 2 3 4 black',String.raw`create text t 1 2 "中文 < & > \"quoted\"" in root`);
  const xml = e.snapshot(); assert.match(xml,/&amp;/); assert.match(xml,/&lt;/);
  const codec = new SvgCodec(); assert.equal(codec.encode(codec.decode(xml).document),xml);
  assert.equal(codec.decode(xml).document.find('t').content(),'中文 < & > "quoted"');
});

test('nested translate and uniform scale follow SVG transform composition', () => {
  const xml = '<svg width="400" height="200"><g id="outer" transform="translate(60,40)"><rect id="a" width="120" height="60"/><g id="inner" transform="translate(200,0) scale(0.8)"><rect id="b" width="120" height="60"/><text id="label" x="60" y="38" text-anchor="middle" font-size="16">End</text></g></g></svg>';
  const codec = new SvgCodec(); const result = codec.decode(xml).document;
  assert.equal(result.find('a').attributes().x,'60'); assert.equal(result.find('b').attributes().x,'260');
  assert.equal(result.find('b').attributes().width,'96'); assert.equal(result.find('label').attributes()['font-size'],'12.8');
  assert.equal(result.find('label').attributes().x,'308'); assert.equal(result.find('label').attributes().y,'70.4');
  const saved = codec.encode(result); assert.ok(!saved.includes('transform=')); assert.equal(codec.encode(codec.decode(saved).document), saved);
  assert.equal(codec.decode('<svg><rect id="r" x="1" transform="scale(2) translate(3,4)"/></svg>').document.find('r').attributes().x,'8');
});

test('transform folding preserves inherited text and stroke scales including SVG defaults', () => {
  const d = new SvgCodec().decode('<svg font-size="20" stroke-width="3"><g id="g" transform="scale(2)"><text id="t">X</text><line id="l"/></g></svg>').document;
  assert.equal(d.find('t').attributes()['font-size'],'40'); assert.equal(d.find('l').attributes()['stroke-width'],'6');
  const defaults = new SvgCodec().decode('<svg><text id="t" transform="scale(2)">X</text></svg>').document;
  assert.equal(defaults.find('t').attributes()['font-size'],'32');
});

test('unknown data-kind degrades to a normal editable group', () => {
  const d = new SvgCodec().decode('<svg><g id="b" data-kind="box"><rect id="r"/></g></svg>').document;
  assert.equal(d.find('b').type,'g'); assert.equal(d.find('b').attributes()['data-kind'],'box'); d.find('b').move(3,4); assert.equal(d.find('r').attributes().x,'3');
});

for (const [name, xml, message] of [
  ['duplicate ids','<svg><g id="a"/><rect id="a"/></svg>',/id already exists: a/],
  ['duplicate root id','<svg id="a"><rect id="a"/></svg>',/id already exists: a/],
  ['bad nesting','<svg><g></svg>',/invalid SVG XML/],
  ['multiple roots','<svg/><svg/>',/invalid SVG XML/],
  ['unknown entity','<svg><text>&bogus;</text></svg>',/invalid SVG XML/],
  ['DTD','<!DOCTYPE svg [<!ENTITY x "hello">]><svg/>',/DTD/],
  ['unsupported shape','<svg><path id="p"/></svg>',/unknown shape type: path/],
  ['foreign namespace','<svg><rect xmlns="urn:other"/></svg>',/unsupported namespace/],
  ['rotation','<svg><g transform="rotate(30)"/></svg>',/unsupported transform/],
  ['nonuniform scale','<svg><rect transform="scale(2,3)"/></svg>',/non-uniform/],
  ['negative scale','<svg><rect transform="scale(-1)"/></svg>',/positive/],
  ['unexpected viewBox','<svg width="100" height="100" viewBox="0 0 50 50"/>',/unsupported viewBox/],
  ['unsupported style','<svg><rect style="fill:red"/></svg>',/unknown attribute: style/],
  ['nested text','<svg><text><tspan>X</tspan></text></svg>',/nested text/],
  ['child of leaf','<svg><rect><circle/></rect></svg>',/not a container/],
] as const) test(`reject ${name} without silent data loss`, () => { assert.throws(() => new SvgCodec().decode(xml),message); });
