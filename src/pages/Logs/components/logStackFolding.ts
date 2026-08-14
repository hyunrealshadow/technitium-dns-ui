import type { EditorState, Extension } from '@codemirror/state';
import { codeFolding, foldEffect, foldService } from '@codemirror/language';
import { ViewPlugin, type EditorView } from '@codemirror/view';

interface StackFoldRange {
  from: number;
  to: number;
}

const isStackFrameLine = (text: string) => /^\s+at\s+/.test(text);
const isStackBoundaryLine = (text: string) => /^\s*--- .*stack trace.*---\s*$/i.test(text);
const isStackDetailLine = (text: string) => isStackFrameLine(text) || isStackBoundaryLine(text);
const isExceptionLine = (text: string) =>
  /^\s*(?:--->\s*)?[A-Za-z_][\w.`+]*(?:Exception|Error)(?=:)/.test(text);
const isInnerExceptionLine = (text: string) => /^\s*--->\s*/.test(text) && isExceptionLine(text);
const isLogEntryLine = (text: string) => /^\[[^\]]+\]\s+/.test(text);
const isErrorLogEntryLine = (text: string) =>
  isLogEntryLine(text) &&
  /\b(?:failed|failure|error|exception|denied|refused|timed?\s*out|unavailable)\b/i.test(text);

function findErrorEntryFoldRange(
  state: EditorState,
  anchorText: string,
  lineEnd: number
): StackFoldRange | null {
  if (!isErrorLogEntryLine(anchorText) || lineEnd >= state.doc.length) return null;

  let line = state.doc.lineAt(lineEnd + 1);
  if (!isExceptionLine(line.text)) return null;

  let foldTo = line.to;
  while (line.to < state.doc.length) {
    const nextLine = state.doc.lineAt(line.to + 1);
    if (isLogEntryLine(nextLine.text)) break;
    line = nextLine;
    foldTo = line.to;
  }

  return { from: lineEnd, to: foldTo };
}

function findStackFoldRange(
  state: EditorState,
  lineStart: number,
  lineEnd: number
): StackFoldRange | null {
  if (lineEnd >= state.doc.length) return null;

  // 折叠箭头应挂在异常描述行，而不是某个即将被隐藏的堆栈帧上。
  const anchorText = state.sliceDoc(lineStart, lineEnd);
  if (isStackDetailLine(anchorText) || isInnerExceptionLine(anchorText)) return null;

  const errorEntryRange = findErrorEntryFoldRange(state, anchorText, lineEnd);
  if (errorEntryRange) return errorEntryRange;

  const isRootException = isExceptionLine(anchorText);
  if (isRootException) {
    const anchorLineNumber = state.doc.lineAt(lineStart).number;
    if (anchorLineNumber > 1) {
      const previousLine = state.doc.line(anchorLineNumber - 1);
      if (isErrorLogEntryLine(previousLine.text)) return null;
    }
  }

  let line = state.doc.lineAt(lineEnd + 1);
  if (!isStackDetailLine(line.text) && !(isRootException && isInnerExceptionLine(line.text))) {
    return null;
  }

  let frameCount = 0;
  let foldTo = line.to;

  while (true) {
    if (isStackFrameLine(line.text)) frameCount += 1;
    foldTo = line.to;

    if (line.to >= state.doc.length) break;
    const nextLine = state.doc.lineAt(line.to + 1);
    if (
      !isStackDetailLine(nextLine.text) &&
      !(isRootException && isInnerExceptionLine(nextLine.text))
    ) {
      break;
    }
    line = nextLine;
  }

  return frameCount > 0 ? { from: lineEnd, to: foldTo } : null;
}

function findAllStackFoldRanges(state: EditorState): StackFoldRange[] {
  const ranges: StackFoldRange[] = [];

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const range = findStackFoldRange(state, line.from, line.to);
    if (!range) continue;

    ranges.push(range);
    lineNumber = state.doc.lineAt(range.to).number;
  }

  return ranges;
}

function countStackFrames(state: EditorState, range: StackFoldRange) {
  return state.sliceDoc(range.from, range.to).split('\n').filter(isStackFrameLine).length;
}

function hidesExceptionDetails(state: EditorState, range: StackFoldRange) {
  return state.sliceDoc(range.from, range.to).split('\n').some(isExceptionLine);
}

function defaultStackFolding() {
  return ViewPlugin.fromClass(
    class {
      private destroyed = false;

      constructor(view: EditorView) {
        // ViewPlugin 构造期间不能同步 dispatch，延后一轮应用初始折叠状态。
        queueMicrotask(() => {
          if (this.destroyed) return;

          const effects = findAllStackFoldRanges(view.state).map(range => foldEffect.of(range));
          if (effects.length > 0) view.dispatch({ effects });
        });
      }

      destroy() {
        this.destroyed = true;
      }
    }
  );
}

export function createLogStackFoldingExtension(
  formatStackFrames: (count: number) => string,
  formatExceptionDetails: (count: number) => string
): Extension {
  return [
    foldService.of(findStackFoldRange),
    codeFolding({
      preparePlaceholder: (state, range) => ({
        frameCount: countStackFrames(state, range),
        exceptionDetails: hidesExceptionDetails(state, range),
      }),
      placeholderDOM: (
        _view,
        onClick,
        prepared: { frameCount: number; exceptionDetails: boolean }
      ) => {
        const placeholder = document.createElement('span');
        placeholder.className = 'cm-foldPlaceholder cm-logStackPlaceholder';
        placeholder.textContent = prepared.exceptionDetails
          ? formatExceptionDetails(prepared.frameCount)
          : formatStackFrames(prepared.frameCount);
        placeholder.setAttribute('role', 'button');
        placeholder.setAttribute('tabindex', '0');
        placeholder.addEventListener('click', onClick);
        placeholder.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
          }
        });
        return placeholder;
      },
    }),
    defaultStackFolding(),
  ];
}
