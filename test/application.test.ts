import test from 'node:test';
import assert from 'node:assert/strict';
import { TestEditor } from './TestEditor.js';

test('pre-init behavior, comments, complete help and quoted arguments', async () => {
  const e = new TestEditor();
  await e.error('tree', "no document. use 'init' or 'read' first");
  await e.error('undo', "no document. use 'init' or 'read' first");
  assert.match(await e.ok('help'), /addto <gid> <id>/);
  assert.equal(await e.ok('  # comment'), ''); await e.run('', 'init', 'create text t 1 2 "你好 world # color"', 'create text empty 0 0 ""');
  assert.equal(e.session.document().find('t').content(), '你好 world # color');
  assert.equal(e.session.document().find('empty').content(), '');
  const before = e.snapshot(); await e.error('set t text "oops', 'unterminated quoted argument'); assert.equal(e.snapshot(), before);
  await e.error('init 1 2 3', 'usage: init [w] [h]'); assert.equal(e.snapshot(), before);
});

test('all geometry types, in clause, omitted styles and exact failures', async () => {
  const e = new TestEditor(); await e.run('init 400 300', 'create g scene', 'create rect r 10.5 20 30 40 in scene', 'create circle c 2 3 4 red in scene', 'create ellipse e 2 3 4 5', 'create line l 1 2 3 4 black', 'create text t 1 2 "hello world" in scene');
  assert.equal(e.session.document().find('r').parent?.label, 'g#scene');
  assert.equal(e.session.document().find('r').attributes().fill, undefined);
  await e.error('create rect r 1 2 3 4', 'id already exists: r');
  await e.error('create g x in missing', 'no such container: missing');
  await e.error('create g x in r', 'not a container: r');
  await e.error('create box b', 'unknown shape type: box (is the plugin loaded?)');
  await e.error('move unknown 1 2', 'no such shape: unknown');
  await e.error('set r bananas 2', 'unknown attribute: bananas');
  await e.error('set c width 2', 'unknown attribute: width');
  await e.error('set scene x 2', 'unknown attribute: x');
  await e.error('scale scene -1', 'scale factor must be positive');
  await e.run('set r fill #abcdef', 'set r width 42', 'set l stroke-width 2', 'set t text "updated text"', 'set scene fill blue');
  assert.match(await e.ok('tree'), /rect#r x=10.5 y=20 w=42 h=40 fill=#abcdef/);
  assert.match(await e.ok('show c'), /parent=g#scene/);
});

test('each edit is one reversible unit, redo branching and display transparency', async () => {
  const e = new TestEditor(); await e.run('init', 'create rect r 10 20 30 40'); const created = e.snapshot();
  await e.ok('move r 30 -2'); const moved = e.snapshot();
  await e.run('tree','show r','help','canvas','undo'); assert.equal(e.snapshot(), created);
  await e.ok('redo'); assert.equal(e.snapshot(), moved);
  await e.run('undo', 'set r fill blue'); await e.error('redo', 'nothing to redo');
  await e.ok('undo'); assert.equal(e.snapshot(), created);
  await e.ok('undo'); assert.equal(e.session.document().all().length, 0);
  await e.error('undo', 'nothing to undo'); await e.ok('redo'); assert.equal(e.snapshot(), created);
});

test('all structural edits restore exact order, parents and IDs', async () => {
  const e = new TestEditor(); await e.run('init', 'create g root', 'create rect a 0 0 1 1 in root', 'create circle b 2 2 1 in root', 'create text c 2 4 "text" in root');
  for (const command of ['group nested c a','move root 3 5','scale root 2','set root stroke red','front a','back c','delete root','addto root a']) {
    const before = e.snapshot(); await e.ok(command); const after = e.snapshot();
    await e.ok('undo'); assert.equal(e.snapshot(), before, command); await e.ok('redo'); assert.equal(e.snapshot(), after, command); await e.ok('undo');
  }
  await e.ok('group nested c a'); const before = e.snapshot();
  assert.deepEqual(e.session.document().find('nested').children().map(s => s.id), ['a','c']);
  await e.ok('ungroup nested'); await e.ok('undo'); assert.equal(e.snapshot(), before);
  await e.error('ungroup root', 'cannot ungroup top-level container: root');
  await e.error('group bad root a', 'cannot group a container into its own descendant: root');
  await e.error('addto nested root', 'cannot move a container into its own descendant: root');
});

test('failed edits preserve both document and redo stack, even after partial recursive mutation', async () => {
  const e = new TestEditor(); await e.run('init','create g g','create rect small 1 2 3 4 in g','create rect large 1e308 2 3 4 in g','set small fill red','undo');
  const before = e.snapshot(); await e.error('scale g 10', 'invalid number for x: Infinity'); assert.equal(e.snapshot(),before);
  await e.ok('redo'); assert.equal(e.session.document().find('small').attributes().fill,'red');
  await e.run('undo'); await e.error('group invalid small missing', 'no such shape: missing'); assert.equal(e.snapshot(),before); await e.ok('redo');
});

test('IO barriers are success-only, reset old history, and unlock on next edit', async () => {
  const e = new TestEditor(); await e.ok('init'); await e.error('undo','undo not allowed after io command'); await e.error('redo','undo not allowed after io command');
  await e.run('create rect r 1 2 3 4','save "space name.svg"'); await e.error('undo','undo not allowed after io command');
  await e.run('move r 1 0','undo'); await e.error('undo','nothing to undo'); await e.ok('redo');
  e.store.failWrite = true; const before = e.snapshot(); await e.error('save bad.svg','cannot write file: bad.svg'); assert.equal(e.snapshot(),before);
  await e.ok('undo'); e.store.failWrite = false; await e.ok('save'); assert.ok(e.store.files.has('space name.svg')); assert.ok(!e.store.files.has('bad.svg'));
  await e.run('set r fill blue'); await e.error('read missing.svg','cannot read file: missing.svg'); await e.ok('undo');
  await e.run('canvas 100 200'); await e.error('undo','undo not allowed after io command');
  await e.run('create g new','read "space name.svg"'); await e.error('undo','undo not allowed after io command');
  await e.run('init'); await e.error('save','no file path. use save <file.svg>');
});

test('invalid document operations retain current document, path, history and warning atomicity', async () => {
  const e = new TestEditor(); await e.run('init','create g old','save old.svg','create rect r 1 2 3 4','move r 1 1','undo'); const before = e.snapshot();
  e.store.files.set('bad.svg','<svg><rect/><path/></svg>');
  await e.error('read bad.svg','unknown shape type: path (is the plugin loaded?)'); assert.equal(e.snapshot(),before);
  await e.error('canvas -1 20','width must be positive'); assert.equal(e.snapshot(),before);
  await e.error('init 10 0','height must be positive'); assert.equal(e.snapshot(),before);
  await e.ok('redo'); assert.equal(e.session.document().find('r').attributes().x,'2'); await e.ok('save'); assert.ok(e.store.files.get('old.svg')!.includes('x="2"'));
});
