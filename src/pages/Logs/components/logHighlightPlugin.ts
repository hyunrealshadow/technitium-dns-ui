import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from '@codemirror/view';

// 日志行高亮：时间戳 / 客户端地址 / DNS App 名 / 用户名 分别着色（颜色用 Mantine CSS 变量，随深浅主题自适应）
export const logHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      const mark = (style: string) => Decoration.mark({ attributes: { style: `color: ${style}` } });
      const timestamp = mark('var(--mantine-color-dimmed)');
      const address = mark('var(--mantine-color-cyan-6)');
      const username = mark('var(--mantine-color-teal-6)');
      const appName = mark('var(--mantine-color-violet-6)');

      for (let pos = 1; pos <= view.state.doc.length; ) {
        const line = view.state.doc.lineAt(pos);
        let offset = 0;
        let rest = line.text;

        // [2026-08-03 12:48:36 UTC]
        const mTime = rest.match(/^\[[^\]]+\]\s*/);
        if (mTime) {
          builder.add(line.from + offset, line.from + offset + mTime[0].length, timestamp);
          offset += mTime[0].length;
          rest = rest.slice(mTime[0].length);

          // [10.10.10.1:56448] 客户端地址
          const mAddr = rest.match(/^\[[0-9a-fA-F:.]+:[0-9]+\]\s*/);
          if (mAddr) {
            builder.add(line.from + offset, line.from + offset + mAddr[0].length, address);
            offset += mAddr[0].length;
            rest = rest.slice(mAddr[0].length);
          }

          // DNS App [Dns Domain Forwarding]: ... 方括号中的 app 名
          const mApp = rest.match(/^DNS App \[[^\]]+\]:\s*/);
          if (mApp) {
            const open = mApp[0].indexOf('[');
            const close = mApp[0].indexOf(']');
            builder.add(line.from + offset + open, line.from + offset + close + 1, appName);
            offset += mApp[0].length;
            rest = rest.slice(mApp[0].length);
          }

          // [admin] 用户名
          const mUser = rest.match(/^\[[^\]]+\]\s*/);
          if (mUser) {
            builder.add(line.from + offset, line.from + offset + mUser[0].length, username);
          }
        }

        pos = line.to + 1;
      }

      return builder.finish();
    }
  },
  {
    // 必须通过该选项把 decorations 暴露给视图，否则高亮不生效
    decorations: v => v.decorations,
  }
);
