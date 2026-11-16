import { EditorSession } from './application/EditorSession.js';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';
import { EditorController } from './presentation/EditorController.js';
import { Repl } from './presentation/Repl.js';
const repl = new Repl(new EditorController(new EditorSession(new FileDocumentStore())));
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
process.exitCode = await repl.run(process.stdin, process.stdout, interactive) && !interactive ? 1 : 0;
