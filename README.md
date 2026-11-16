# Lab1 Phase 1：SVG CLI 编辑器

学号：**26213050215**。TypeScript 面向对象实现，使用 Command、Composite、Memento 和依赖倒置；支持六种基础图形、树编辑、SVG 读写与事务式撤销重做。

## 启动与验证

需要 Node.js 22 或更新版本、npm。

```sh
npm ci
npm run cli
```

交互提示符是 `svg>`；按 Ctrl-D 退出。命令输出和错误均写到标准输出，错误以 `error:` 开头。脚本模式不显示提示符，逐行串行处理，遇到错误仍继续；发生过错误则最终退出码为 1。

```sh
npm run check                 # 编译 + 功能测试 + 架构检查 + 格式检查
npm run build
node dist/src/main.js < examples/flowchart.commands
```

最后一条命令会在当前目录生成 `flowchart.svg`，可以直接拖入浏览器预览。已生成的参考输出见 [examples/flowchart.svg](examples/flowchart.svg)。

## 最小示例

```text
init 800 600
create g scene
create rect r1 20 30 120 60 #4a90d9 in scene
create text title 40 65 "你好 SVG" in scene
move scene 30 10
undo
redo
tree
save demo.svg
```

## 命令

| 类别 | 命令                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 文档 | `init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w] [h]`                 |
| 创建 | `create <type> <id> [params...] [in <containerId>]`                                    |
| 编辑 | `delete <id>`、`move <id> <dx> <dy>`、`scale <id> <factor>`、`set <id> <attr> <value>` |
| 结构 | `group <newGid> <id1> [id2...]`、`ungroup <gid>`、`addto <gid> <id>`                   |
| 层叠 | `front <id>`、`back <id>`                                                              |
| 查看 | `tree [id]`、`show <id>`、`help`                                                       |
| 历史 | `undo`、`redo`                                                                         |

| 类型    | create 参数               |
| ------- | ------------------------- |
| rect    | `x y width height [fill]` |
| circle  | `cx cy r [fill]`          |
| ellipse | `cx cy rx ry [fill]`      |
| line    | `x1 y1 x2 y2 [stroke]`    |
| text    | `x y "content"`           |
| g       | 无                        |

`set` 接受 `fill`、`stroke`、`stroke-width`、对应类型的几何属性，以及文字的 `text` 内容。ID 大小写敏感且全局唯一；颜色以 `#` 开头可以直接作为参数，只有整行首个非空白字符为 `#` 时才是注释。双引号内支持 `\"`、`\\`、`\n`、`\r`、`\t`。

## 约定与范围

- 一条编辑命令对应一个撤销单元；任何失败均不改变当前文档、路径及历史。新编辑清除 redo；查看命令保持历史。
- 成功的 `init/read/save` 以及修改尺寸的 `canvas` 清空并锁住历史；下一条成功编辑重新解锁。`canvas` 查询不影响历史。
- `init` 默认 800×600；只给宽度时高度为 600。`canvas` 只给宽度时保留当前高度。画布尺寸为正数，图形尺寸可为 0，坐标可为负，所有数值必须有限。
- `save` 无参数使用最近成功 `read/save` 的路径；`init` 清除路径。
- `group` 使用最近公共祖先作为父级，在最早涉及的分支前插入；组内按原文档深度优先顺序排列，原父容器即使变空也保留。
- 按作业要求，画布直接子级的 `g` 禁止 `ungroup`。嵌套组解散时子图形提升到原组位置。`front` 移到同级列表末尾，`back` 移到开头，符合 SVG 绘制顺序。
- `move/scale` 递归修改几何值；CLI `scale` 不改字体大小和线宽。`set g fill/stroke/stroke-width` 设置组样式，遵循 SVG 继承，子图形的显式样式优先。
- 导入支持上述六种图形、缺 ID 自动补齐、`translate` 与正数等比 `scale`。变换折算到坐标，并保留文本字体与线宽的缩放效果。支持基础字体属性与 `data-kind`；未知 `data-kind` 降级为普通组。
- 不支持的元素、属性、旋转、非等比缩放、CSS style/class、路径、tspan、百分比/单位尺寸、DTD 或非 `0 0 width height` 的 viewBox 明确报错。不是完整 SVG 浏览器引擎。
- `box` 属于后续插件阶段，本阶段报 `unknown shape type`。

## 项目文档

[doc/README.md](doc/README.md) 包含架构方案、PlantUML 组件图、设计模式、依赖规则、变化点、开发迭代记录、一致性自查和验证依据。示例输入见 [examples/](examples/)。
