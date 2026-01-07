// 全局错误状态管理
import { atom } from 'jotai';

export interface ErrorInfo {
  message: string;
  details?: string;
}

export const errorAtom = atom<ErrorInfo | null>(null);

export const hasErrorAtom = atom(get => get(errorAtom) !== null);

export const clearErrorAtom = atom(null, (_, set) => {
  set(errorAtom, null);
});

export const setErrorAtom = atom(null, (_, set, error: ErrorInfo) => {
  set(errorAtom, error);
});
