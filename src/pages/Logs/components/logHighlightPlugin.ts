import type { Range } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from '@codemirror/view';

const mark = (className: string) => Decoration.mark({ attributes: { class: className } });

const timestamp = mark('cm-logTimestamp');
const address = mark('cm-logAddress');
const username = mark('cm-logUsername');
const appName = mark('cm-logAppName');
const dnsQuestion = mark('cm-logDnsQuestion');
const url = mark('cm-logUrl');
const endpointAddress = mark('cm-logEndpointAddress');
const exceptionType = mark('cm-logExceptionType');
const exceptionArrow = mark('cm-logExceptionArrow');
const stackKeyword = mark('cm-logStackKeyword');
const stackMethod = mark('cm-logStackMethod');
const stackLineNumber = mark('cm-logStackLineNumber');
const stackBoundary = mark('cm-logStackBoundary');
const errorLine = Decoration.line({
  attributes: { class: 'cm-logErrorLine' },
});

export const logHighlightTheme = EditorView.baseTheme({
  '&light .cm-logTimestamp, &light .cm-logStackKeyword, &light .cm-logStackBoundary': {
    color: '#a0a1a7',
  },
  '&dark .cm-logTimestamp, &dark .cm-logStackKeyword, &dark .cm-logStackBoundary': {
    color: '#7d8799',
  },
  '&light .cm-logAddress, &light .cm-logUrl': {
    color: '#0184bc',
  },
  '&dark .cm-logAddress, &dark .cm-logUrl': {
    color: '#56b6c2',
  },
  '&light .cm-logEndpointAddress': {
    color: '#986801',
  },
  '&dark .cm-logEndpointAddress': {
    color: '#e5c07b',
  },
  '&light .cm-logStackLineNumber': {
    color: '#696c77',
    fontWeight: '600',
  },
  '&dark .cm-logStackLineNumber': {
    color: '#abb2bf',
    fontWeight: '600',
  },
  '&light .cm-logUsername': {
    color: '#50a14f',
  },
  '&dark .cm-logUsername': {
    color: '#98c379',
  },
  '&light .cm-logAppName': {
    color: '#a626a4',
  },
  '&dark .cm-logAppName': {
    color: '#c678dd',
  },
  '&light .cm-logDnsQuestion': {
    color: '#4078f2',
  },
  '&dark .cm-logDnsQuestion': {
    color: '#61afef',
  },
  '.cm-logDnsQuestion': {
    fontWeight: '600',
  },
  '&light .cm-logExceptionType, &light .cm-logStackMethod': {
    color: '#e45649',
  },
  '&dark .cm-logExceptionType, &dark .cm-logStackMethod': {
    color: '#e06c75',
  },
  '.cm-logExceptionType': {
    fontWeight: '600',
  },
  '.cm-logStackMethod': {
    fontWeight: '500',
  },
  '&light .cm-logExceptionArrow': {
    color: '#986801',
  },
  '&dark .cm-logExceptionArrow': {
    color: '#d19a66',
  },
  '.cm-logExceptionArrow': {
    fontWeight: '600',
  },
  '.cm-logStackBoundary': {
    fontStyle: 'italic',
  },
  '&light .cm-logErrorLine': {
    backgroundColor: 'rgba(228, 86, 73, 0.08)',
    boxShadow: 'none',
  },
  '&dark .cm-logErrorLine': {
    backgroundColor: 'rgba(224, 108, 117, 0.1)',
    boxShadow: 'none',
  },
});

function addRange(ranges: Range<Decoration>[], decoration: Decoration, from: number, to: number) {
  if (to > from) ranges.push(decoration.range(from, to));
}

function addMatches(
  ranges: Range<Decoration>[],
  decoration: Decoration,
  text: string,
  baseOffset: number,
  expression: RegExp,
  group = 0
) {
  for (const match of text.matchAll(expression)) {
    const value = match[group];
    if (!value || match.index == null) continue;

    const groupOffset = group === 0 ? 0 : match[0].indexOf(value);
    const from = baseOffset + match.index + groupOffset;
    addRange(ranges, decoration, from, from + value.length);
  }
}

// 日志高亮分为两层：摘要中的关键对象保持醒目，异常堆栈则降低视觉权重。
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
      const ranges: Range<Decoration>[] = [];

      for (const visibleRange of view.visibleRanges) {
        let pos = visibleRange.from;

        while (pos <= visibleRange.to) {
          const line = view.state.doc.lineAt(pos);
          const text = line.text;
          let contentOffset = 0;

          // [2026-08-14 00:08:22 Local]
          const timeMatch = text.match(/^\[[^\]]+\]\s*/);
          if (timeMatch) {
            addRange(ranges, timestamp, line.from, line.from + timeMatch[0].length);
            contentOffset = timeMatch[0].length;

            // [10.10.10.1:56448] 客户端地址
            const addressMatch = text.slice(contentOffset).match(/^\[[0-9a-fA-F:.]+:[0-9]+\]\s*/);
            if (addressMatch) {
              addRange(
                ranges,
                address,
                line.from + contentOffset,
                line.from + contentOffset + addressMatch[0].length
              );
              contentOffset += addressMatch[0].length;
            }

            // DNS App [Dns Domain Forwarding]: ... 方括号中的 App 名
            const appMatch = text.slice(contentOffset).match(/^DNS App \[[^\]]+\]:\s*/);
            if (appMatch) {
              const open = appMatch[0].indexOf('[');
              const close = appMatch[0].indexOf(']');
              addRange(
                ranges,
                appName,
                line.from + contentOffset + open,
                line.from + contentOffset + close + 1
              );
              contentOffset += appMatch[0].length;
            }

            // [admin] 用户名
            const userMatch = text.slice(contentOffset).match(/^\[[^\]]+\]\s*/);
            if (userMatch) {
              addRange(
                ranges,
                username,
                line.from + contentOffset,
                line.from + contentOffset + userMatch[0].length
              );
              contentOffset += userMatch[0].length;
            }
          }

          const content = text.slice(contentOffset);
          addMatches(ranges, url, content, line.from + contentOffset, /https?:\/\/[^\s"'<>]+/gi);
          addMatches(
            ranges,
            endpointAddress,
            content,
            line.from + contentOffset,
            /\(((?:\d{1,3}\.){3}\d{1,3})\)/g,
            1
          );
          addMatches(
            ranges,
            endpointAddress,
            content,
            line.from + contentOffset,
            /\(\[([0-9a-f:]+)\]\)/gi,
            1
          );

          const isErrorSummary =
            timeMatch != null &&
            /\b(?:failed|failure|error|exception|denied|refused|timed?\s*out|unavailable)\b/i.test(
              content
            );

          if (isErrorSummary) {
            ranges.push(errorLine.range(line.from));
            addMatches(ranges, dnsQuestion, content, line.from + contentOffset, /'([^']+)'/g, 1);
          }

          // System.Net.Http.HttpRequestException: ... / ---> System.IO.IOException: ...
          const exceptionMatch = text.match(
            /^(\s*(?:--->\s*)?)([A-Za-z_][\w.`+]*(?:Exception|Error))(?=:)/
          );
          if (exceptionMatch) {
            const arrowIndex = exceptionMatch[1].indexOf('--->');
            if (arrowIndex >= 0) {
              addRange(ranges, exceptionArrow, line.from + arrowIndex, line.from + arrowIndex + 4);
            }

            const typeOffset = exceptionMatch[0].lastIndexOf(exceptionMatch[2]);
            addRange(
              ranges,
              exceptionType,
              line.from + typeOffset,
              line.from + typeOffset + exceptionMatch[2].length
            );
          } else if (/^\s*--- .*stack trace.*---\s*$/i.test(text)) {
            addRange(ranges, stackBoundary, line.from, line.to);
          } else if (/^\s+at\s+/.test(text)) {
            const frameMatch = text.match(/^(\s*at\s+)(.+?)(?=\()/);
            if (frameMatch) {
              const methodOffset = frameMatch[2].lastIndexOf('.') + 1;
              addRange(ranges, stackKeyword, line.from, line.from + frameMatch[1].length);
              addRange(
                ranges,
                stackMethod,
                line.from + frameMatch[1].length + methodOffset,
                line.from + frameMatch[1].length + frameMatch[2].length
              );
            }
            addMatches(
              ranges,
              stackLineNumber,
              text,
              line.from,
              /:(line\s+\d+|\d+(?::\d+)?)(?=\)?\s*$)/gi,
              1
            );
          }

          if (line.to >= visibleRange.to || line.to === view.state.doc.length) break;
          pos = line.to + 1;
        }
      }

      return Decoration.set(ranges, true);
    }
  },
  {
    decorations: value => value.decorations,
  }
);
