import { EditCommand } from './EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); args.check(3); }
  apply(document: SvgDocument): string { const shape = document.find(this.args.at(0)); shape.set(this.args.at(1), this.args.at(2)); return `${shape.label} updated: ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`; }
}
