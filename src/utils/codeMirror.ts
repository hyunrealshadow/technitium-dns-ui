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

// 浅色模式语法高亮：使用 Mantine 色板（深色档位，适合浅色背景）
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--mantine-color-blue-7)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--mantine-color-green-8)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--mantine-color-orange-8)' },
  { tag: [tags.propertyName, tags.attributeName], color: 'var(--mantine-color-cyan-8)' },
  { tag: [tags.typeName, tags.className], color: 'var(--mantine-color-violet-8)' },
  { tag: [tags.regexp, tags.escape], color: 'var(--mantine-color-red-7)' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--mantine-color-dimmed)',
    fontStyle: 'italic',
  },
  { tag: [tags.punctuation, tags.bracket, tags.operator], color: 'var(--mantine-color-gray-7)' },
  { tag: tags.meta, color: 'var(--mantine-color-dimmed)' },
]);

// 浅色模式现代主题：背景融入容器、柔和行高亮、Mantine 强调色选中、现代 tooltip/搜索面板
const lightUiTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: 'var(--mantine-color-text)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--mantine-color-text)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--mantine-color-primary-light)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--mantine-color-dimmed)',
      borderRight: '1px solid var(--mantine-color-default-border)',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--mantine-color-default-hover)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--mantine-color-text)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--mantine-color-yellow-light)',
      outline: 'none',
    },
    '.cm-searchMatch-selected': {
      backgroundColor: 'var(--mantine-color-yellow-3)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'var(--mantine-color-gray-2)',
      outline: 'none',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--mantine-color-body)',
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 'var(--mantine-radius-md)',
      boxShadow: 'var(--mantine-shadow-md)',
      color: 'var(--mantine-color-text)',
      overflow: 'hidden',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--mantine-color-primary-light)',
      color: 'var(--mantine-color-text)',
    },
    '.cm-tooltip-autocomplete > ul > li': {
      padding: '2px 8px',
    },
  },
  { dark: false }
);

// 浅色模式完整主题（UI + 语法高亮），深色模式继续使用 oneDark
export const codeMirrorLightTheme = [lightUiTheme, syntaxHighlighting(lightHighlightStyle)];
