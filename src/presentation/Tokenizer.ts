export class Tokenizer {
  tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith("#")) return [];
    const tokens: string[] = [];
    let token = "";
    let quoted = false;
    let started = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index]!;
      if (char === '"') {
        quoted = !quoted;
        started = true;
        continue;
      }
      if (char === "\\" && quoted) {
        const next = line[++index];
        if (next === undefined) throw new Error("unterminated quoted argument");
        const escapes: Record<string, string> = {
          n: "\n",
          r: "\r",
          t: "\t",
          '"': '"',
          "\\": "\\",
        };
        token += escapes[next] ?? `\\${next}`;
        started = true;
        continue;
      }
      if (/\s/.test(char) && !quoted) {
        if (started) tokens.push(token);
        token = "";
        started = false;
      } else {
        token += char;
        started = true;
      }
    }
    if (quoted) throw new Error("unterminated quoted argument");
    if (started) tokens.push(token);
    return tokens;
  }
}
