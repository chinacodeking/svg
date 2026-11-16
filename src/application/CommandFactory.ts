import { Arguments } from "./Arguments.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Command } from "./commands/Command.js";
import { HelpCommand } from "./commands/HelpCommand.js";
import { InitCommand } from "./commands/InitCommand.js";
import { ReadCommand } from "./commands/ReadCommand.js";
import { SaveCommand } from "./commands/SaveCommand.js";
import { CanvasCommand } from "./commands/CanvasCommand.js";
import { CreateCommand } from "./commands/CreateCommand.js";
import { DeleteCommand } from "./commands/DeleteCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { ScaleCommand } from "./commands/ScaleCommand.js";
import { SetCommand } from "./commands/SetCommand.js";
import { GroupCommand } from "./commands/GroupCommand.js";
import { UngroupCommand } from "./commands/UngroupCommand.js";
import { AddToCommand } from "./commands/AddToCommand.js";
import { FrontCommand } from "./commands/FrontCommand.js";
import { BackCommand } from "./commands/BackCommand.js";
import { TreeCommand } from "./commands/TreeCommand.js";
import { ShowCommand } from "./commands/ShowCommand.js";
import { UndoCommand } from "./commands/UndoCommand.js";
import { RedoCommand } from "./commands/RedoCommand.js";
/** The only command-name dispatch point; future command providers register here. */
export class CommandFactory {
  private readonly shapes = new ShapeFactory();
  private readonly entries = new Map<
    string,
    { syntax: string; build: (args: Arguments) => Command }
  >([
    [
      "init",
      { syntax: "init [w] [h]", build: (args) => new InitCommand(args) },
    ],
    [
      "read",
      { syntax: "read <file.svg>", build: (args) => new ReadCommand(args) },
    ],
    [
      "save",
      { syntax: "save [file.svg]", build: (args) => new SaveCommand(args) },
    ],
    [
      "canvas",
      { syntax: "canvas [w] [h]", build: (args) => new CanvasCommand(args) },
    ],
    [
      "create",
      {
        syntax: "create <type> <id> [params...] [in <containerId>]",
        build: (args) => new CreateCommand(args, this.shapes),
      },
    ],
    [
      "delete",
      { syntax: "delete <id>", build: (args) => new DeleteCommand(args) },
    ],
    [
      "move",
      { syntax: "move <id> <dx> <dy>", build: (args) => new MoveCommand(args) },
    ],
    [
      "scale",
      {
        syntax: "scale <id> <factor>",
        build: (args) => new ScaleCommand(args),
      },
    ],
    [
      "set",
      {
        syntax: "set <id> <attr> <value>",
        build: (args) => new SetCommand(args),
      },
    ],
    [
      "group",
      {
        syntax: "group <newGid> <id1> [id2...]",
        build: (args) => new GroupCommand(args),
      },
    ],
    [
      "ungroup",
      { syntax: "ungroup <gid>", build: (args) => new UngroupCommand(args) },
    ],
    [
      "addto",
      { syntax: "addto <gid> <id>", build: (args) => new AddToCommand(args) },
    ],
    [
      "front",
      { syntax: "front <id>", build: (args) => new FrontCommand(args) },
    ],
    ["back", { syntax: "back <id>", build: (args) => new BackCommand(args) }],
    ["tree", { syntax: "tree [id]", build: (args) => new TreeCommand(args) }],
    ["show", { syntax: "show <id>", build: (args) => new ShowCommand(args) }],
    ["undo", { syntax: "undo", build: (args) => new UndoCommand(args) }],
    ["redo", { syntax: "redo", build: (args) => new RedoCommand(args) }],
    [
      "help",
      {
        syntax: "help",
        build: (args) => {
          args.check(0);
          return new HelpCommand(this.help());
        },
      },
    ],
  ]);
  create(tokens: readonly string[]): Command {
    const name = tokens[0]!;
    const entry = this.entries.get(name);
    if (!entry) throw new Error(`unknown command: ${name}`);
    return entry.build(new Arguments(tokens.slice(1), entry.syntax));
  }
  private help(): string[] {
    return [...this.entries.values()]
      .map((entry) => entry.syntax)
      .concat([
        "  rect: x y w h [fill] | circle: cx cy r [fill] | ellipse: cx cy rx ry [fill]",
        '  line: x1 y1 x2 y2 [stroke] | text: x y "content" | g: (no params)',
        "  set: fill, stroke, stroke-width, geometry attributes, text content",
        "  # starts a full-line comment; double quotes preserve spaces; Ctrl-D exits",
      ]);
  }
}
