import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import { EditorController } from "./EditorController.js";
export class Repl {
  constructor(private readonly controller: EditorController) {}
  async run(
    input: Readable,
    output: Writable,
    interactive: boolean,
  ): Promise<boolean> {
    const reader = createInterface({
      input,
      output,
      terminal: interactive,
      crlfDelay: Infinity,
    });
    let failed = false;
    if (interactive) {
      output.write("svg-editor 0.1 — type 'help' for commands\n\n");
      reader.setPrompt("svg> ");
      reader.prompt();
    }
    for await (const line of reader) {
      const result = await this.controller.execute(line);
      failed ||= result.failed;
      for (const message of result.lines) output.write(message + "\n");
      if (interactive) reader.prompt();
    }
    return failed;
  }
}
