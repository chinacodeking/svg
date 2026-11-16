import { Command } from "./Command.js";
export class HelpCommand extends Command {
  constructor(private readonly text: string[]) {
    super();
  }
  async execute(): Promise<string[]> {
    return this.text;
  }
}
