import { atomWithStorage } from 'jotai/utils';

// 颜色模式类型
export type ColorMode = 'light' | 'dark' | 'auto';

// 使用localStorage持久化存储颜色模式
// 如果用户的系统偏好是暗黑模式，默认使用暗黑模式
const getInitialColorMode = (): ColorMode => {
  if (typeof window === 'undefined') return 'auto';

  const stored = localStorage.getItem('colorMode') as ColorMode | null;
  if (stored) return stored;

  // 检查系统偏好
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const colorModeAtom = atomWithStorage<ColorMode>('colorMode', getInitialColorMode());

// 将颜色模式解析为实际生效的模式（auto 时按系统偏好解析）
export function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'auto') {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
}
