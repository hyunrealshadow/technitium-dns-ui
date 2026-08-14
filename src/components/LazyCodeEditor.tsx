import { lazy, Suspense } from 'react';
import { Skeleton } from '@mantine/core';

const CodeEditor = lazy(() => import('./CodeEditor'));

export interface LazyCodeEditorProps {
  mode: 'json' | 'jsonc' | 'log';
  value: string;
  height?: string;
  isDark: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  formatStackFrames?: (count: number) => string;
  formatExceptionDetails?: (count: number) => string;
}

export function LazyCodeEditor(props: LazyCodeEditorProps) {
  return (
    <Suspense fallback={<Skeleton height={props.height ?? '400px'} radius="sm" />}>
      <CodeEditor {...props} />
    </Suspense>
  );
}
