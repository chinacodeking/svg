import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { EditorController } from '../src/presentation/EditorController.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { TestEditor } from './TestEditor.js';

test('real filesystem atomic writes, read-only/missing paths and failure state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svg-test-'));
  try {
    const store = new FileDocumentStore(); const session = new EditorSession(store); const editor = new EditorController(session);
    await editor.execute('init 400 300'); await editor.execute('create rect r 1 2 3 4 red');
    const file = join(directory,'with space.svg');
    assert.equal((await editor.execute(`save "${file}"`)).failed,false);
    const original = await readFile(file,'utf8'); await chmod(file,0o444);
    await editor.execute('move r 1 1');
    assert.deepEqual((await editor.execute(`save "${file}"`)).lines,[`error: cannot write file: ${file}`]);
    assert.equal(await readFile(file,'utf8'),original); assert.equal((await editor.execute('undo')).failed,false);
    assert.deepEqual(await readdir(directory),['with space.svg']);
    const bad = join(directory,'absent','bad.svg');
    assert.deepEqual((await editor.execute(`save "${bad}"`)).lines,[`error: cannot write file: ${bad}`]);
    await assert.rejects(store.read(bad),new RegExp('cannot read file'));
    await chmod(file,0o644); await editor.execute('save');
    assert.equal((await store.read(file)).document.find('r').attributes().x,'1');
    await writeFile(join(directory,'malformed.svg'),'<svg><rect></svg>');
    assert.equal((await editor.execute(`read "${join(directory,'malformed.svg')}"`)).failed,true);
    assert.equal(session.document().find('r').attributes().x,'1');
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test('real CLI replays flowchart in order through asynchronous file IO', async () => {
  const directory = await mkdtemp(join(tmpdir(),'svg-cli-'));
  try {
    const script = await readFile('examples/flowchart.commands','utf8');
    const result = spawnSync(process.execPath,[resolve('dist/src/main.js')],{cwd:directory,input:script,encoding:'utf8'});
    assert.equal(result.status,0,result.stdout+result.stderr);
    assert.match(result.stdout,/saved to flowchart.svg \(8 elements\)/);
    assert.match(result.stdout,/text#process-label \(545,135\) "处理数据 v2"/);
    const doc = new SvgCodec().decode(await readFile(join(directory,'flowchart.svg'),'utf8')).document;
    assert.equal(doc.all().length,8); assert.equal(doc.find('process').attributes().y,'100');
    const second = spawnSync(process.execPath,[resolve('dist/src/main.js')],{cwd:directory,input:'read flowchart.svg\nmove node2 0 100\nsave\nread flowchart.svg\nshow process\n',encoding:'utf8'});
    assert.equal(second.status,0,second.stdout+second.stderr); assert.match(second.stdout,/y=200/);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test('CLI reports one-line errors, continues processing and gives failing scripts exit 1', () => {
  const result = spawnSync(process.execPath,['dist/src/main.js'],{input:'tree\ninit\ncreate box b\ncreate rect r 1 2 3 4\ntree\n',encoding:'utf8'});
  assert.equal(result.status,1); assert.equal(result.stdout.split('\n').filter(line => line.startsWith('error:')).length,2); assert.match(result.stdout,/rect#r/);
});

test('long mixed edit history restores every prior state then replays identically', async () => {
  const e = new TestEditor(); await e.run('init', 'create g root'); const states = [e.snapshot()];
  for (let i=0;i<40;i++) {
    for (const command of [`create rect r${i} ${i} ${i+1} 2 3 in root`, `move root 0.25 -0.5`, `set r${i} fill #aabbcc`, `back r${i}`]) { await e.ok(command); states.push(e.snapshot()); }
  }
  for (let i=states.length-2;i>=0;i--) { await e.ok('undo'); assert.equal(e.snapshot(),states[i]); }
  for (let i=1;i<states.length;i++) { await e.ok('redo'); assert.equal(e.snapshot(),states[i]); }
});
