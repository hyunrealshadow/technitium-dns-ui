import { EditorView } from '@codemirror/view';
import { foldGutter, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// 跨平台等宽字体栈（macOS: SF Mono/Menlo/Monaco，Windows: Cascadia Code/Consolas）
const monoFontStack =
  "ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, Monaco, 'DejaVu Sans Mono', monospace";

// CodeMirror 全局样式：内容与行号统一使用等宽字体
export const codeMirrorFontTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
  },
  '.cm-content': {
    fontFamily: monoFontStack,
    fontVariantLigatures: 'none',
  },
  '.cm-gutters': {
    fontFamily: monoFontStack,
  },
  // 自定义折叠标记（SVG chevron 图标）
  '.cm-foldGutter .cm-fold-marker': {
    color: 'var(--mantine-color-dimmed)',
    cursor: 'pointer',
  },
  '.cm-foldGutter .cm-fold-marker:hover': {
    color: 'var(--mantine-color-text)',
  },
  // 折叠占位符
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--mantine-color-gray-light)',
    border: 'none',
    borderRadius: 'var(--mantine-radius-sm)',
    color: 'var(--mantine-color-dimmed)',
    padding: '0 4px',
    margin: '0 2px',
  },
  '.cm-logStackPlaceholder': {
    cursor: 'pointer',
    fontStyle: 'italic',
    userSelect: 'none',
  },
  '.cm-logStackPlaceholder:hover': {
    color: 'var(--mantine-color-text)',
  },
});

// 自定义折叠箭头：SVG chevron（替代默认字符图标），颜色继承 currentColor 随主题
export const foldGutterExtension = foldGutter({
  markerDOM(open: boolean) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // chevron-down（展开态） / chevron-right（折叠态）
    path.setAttribute('d', open ? 'm6 9 6 6 6-6' : 'm9 6 6 6-6 6');
    svg.appendChild(path);
    svg.classList.add('cm-fold-marker');
    return svg as unknown as HTMLElement;
  },
});

// 浅色模式：Atom One Light 主题（配色对齐 atom/one-light-syntax）
// UI 层：背景 #fafafa、文本 #383a42、选区/行高亮灰、gutter 浅灰
const oneLightUi = EditorView.theme(
  {
    '&': {
      backgroundColor: '#fafafa',
      color: '#383a42',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-content': {
      caretColor: '#526eff',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#526eff',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#e5e5e6',
    },
    '.cm-gutters': {
      backgroundColor: '#fafafa',
      color: '#a0a1a7',
      borderRight: '1px solid #e5e5e6',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(229, 229, 230, 0.6)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#383a42',
    },
    '.cm-searchMatch': {
      backgroundColor: '#e5e5e6',
      outline: 'none',
    },
    '.cm-searchMatch-selected': {
      backgroundColor: '#a0a1a7',
      color: '#fafafa',
    },
    '.cm-matchingBracket': {
      backgroundColor: '#e5e5e6',
      outline: 'none',
    },
    '.cm-tooltip': {
      backgroundColor: '#fafafa',
      border: '1px solid #e5e5e6',
      borderRadius: 'var(--mantine-radius-md)',
      boxShadow: 'var(--mantine-shadow-md)',
      color: '#383a42',
      overflow: 'hidden',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: '#e5e5e6',
      color: '#383a42',
    },
    '.cm-tooltip-autocomplete > ul > li': {
      padding: '2px 8px',
    },
  },
  { dark: false }
);

// Atom One Light 语法高亮配色
const oneLightHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.self], color: '#a626a4' },
  { tag: [tags.string, tags.special(tags.string), tags.inserted], color: '#50a14f' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#986801' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#4078f2' },
  { tag: [tags.propertyName, tags.attributeName], color: '#986801' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#c18401' },
  { tag: [tags.tagName, tags.heading], color: '#e45649' },
  { tag: [tags.regexp, tags.escape, tags.link], color: '#50a14f' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment, tags.meta],
    color: '#a0a1a7',
    fontStyle: 'italic',
  },
  { tag: [tags.punctuation, tags.bracket, tags.operator], color: '#383a42' },
]);

// 浅色模式完整主题（Atom One Light），深色模式继续使用 oneDark
export const codeMirrorLightTheme = [oneLightUi, syntaxHighlighting(oneLightHighlightStyle)];
