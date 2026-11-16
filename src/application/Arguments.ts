import { Numeric } from '../domain/Numeric.js';
export class Arguments {
  constructor(private readonly values: readonly string[], private readonly usage: string) {}
  get length(): number { return this.values.length; }
  check(min: number, max = min): void { if (this.length < min || this.length > max) throw new Error(`usage: ${this.usage}`); }
  at(index: number): string { const result = this.values[index]; if (result === undefined) throw new Error(`usage: ${this.usage}`); return result; }
  optional(index: number): string | undefined { return this.values[index]; }
  number(index: number): number { return Numeric.parse(this.at(index), `argument ${index + 1}`); }
  rest(start: number): readonly string[] { return this.values.slice(start); }
}
