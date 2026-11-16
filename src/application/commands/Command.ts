import type { EditorSession } from '../EditorSession.js';
export abstract class Command { abstract execute(session: EditorSession): Promise<string[]>; }
