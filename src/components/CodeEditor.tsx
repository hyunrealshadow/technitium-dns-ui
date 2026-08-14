import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { jsonc } from '@platformos/lang-jsonc';
import {
  codeMirrorFontTheme,
  codeMirrorLightTheme,
  foldGutterExtension,
} from '../utils/codeMirror';
import { logHighlightPlugin, logHighlightTheme } from '../pages/Logs/components/logHighlightPlugin';
import { createLogStackFoldingExtension } from '../pages/Logs/components/logStackFolding';
import type { LazyCodeEditorProps } from './LazyCodeEditor';

export default function CodeEditor({
  mode,
  value,
  height = '400px',
  isDark,
  readOnly = false,
  onChange,
  formatStackFrames,
  formatExceptionDetails,
}: LazyCodeEditorProps) {
  const extensions = useMemo(() => {
    const shared = [codeMirrorFontTheme, foldGutterExtension];

    if (mode === 'log') {
      return [
        EditorView.lineWrapping,
        logHighlightPlugin,
        logHighlightTheme,
        createLogStackFoldingExtension(
          formatStackFrames ?? (count => `${count} stack frames`),
          formatExceptionDetails ?? (count => `${count} exception details`)
        ),
        ...shared,
      ];
    }

    return [mode === 'jsonc' ? jsonc() : json(), ...shared];
  }, [formatExceptionDetails, formatStackFrames, mode]);

  return (
    <CodeMirror
      // CodeMirror themes are creation-time extensions, so recreate it on a theme change.
      key={isDark ? 'dark' : 'light'}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      height={height}
      extensions={extensions}
      theme={isDark ? oneDark : codeMirrorLightTheme}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: mode !== 'log',
        highlightActiveLineGutter: mode !== 'log',
      }}
    />
  );
}
