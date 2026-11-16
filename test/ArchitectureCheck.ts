import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, basename, relative, sep } from "node:path";
export class ArchitectureCheck {
  run(): void {
    const root = resolve("src");
    const failures: string[] = [];
    let files = 0;
    const allowed: Record<string, readonly string[]> = {
      domain: ["domain"],
      application: ["application", "domain"],
      presentation: ["presentation", "application"],
      infrastructure: ["infrastructure", "application", "domain"],
    };
    for (const entry of readdirSync(root, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      const path = resolve(entry.parentPath, entry.name);
      const local = relative(root, path);
      const layer = local.split(sep)[0]!;
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      files++;
      const classes = source.statements.filter(ts.isClassDeclaration);
      if (
        classes.length > 1 ||
        classes.some((item) => item.name?.text !== basename(path, ".ts"))
      )
        failures.push(`${local}: one class per matching file required`);
      for (const node of source.statements) {
        if (ts.isFunctionDeclaration(node))
          failures.push(`${local}: top-level procedural function`);
        if (
          !ts.isImportDeclaration(node) ||
          !ts.isStringLiteral(node.moduleSpecifier)
        )
          continue;
        const target = node.moduleSpecifier.text;
        if (!target.startsWith(".")) {
          if (layer === "domain" || layer === "application")
            failures.push(`${local}: external dependency ${target}`);
          continue;
        }
        const targetLayer = relative(
          root,
          resolve(dirname(path), target),
        ).split(sep)[0]!;
        if (
          layer === "infrastructure" &&
          targetLayer === "application" &&
          !relative(root, resolve(dirname(path), target)).startsWith(
            `application${sep}ports${sep}`,
          )
        ) {
          failures.push(
            `${local}: infrastructure may only depend on application ports: ${target}`,
          );
        }
        if (allowed[layer] && !allowed[layer]!.includes(targetLayer))
          failures.push(`${local}: forbidden dependency ${target}`);
      }
    }
    if (failures.length) throw new Error(failures.join("\n"));
    console.log(
      `Architecture check passed: ${files} source files, layer imports, class names and top-level functions checked.`,
    );
  }
}
new ArchitectureCheck().run();
