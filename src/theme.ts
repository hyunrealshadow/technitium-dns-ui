import { createTheme, type MantineColorsTuple } from '@mantine/core';

// 品牌主色：现代感蓝色梯度（index 6 为浅色模式填充色，index 5 为深色模式填充色）
const brand: MantineColorsTuple = [
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a',
];

// 深色模式中性色：在 Mantine 默认 dark 基础上加入轻微蓝灰倾向，层次更干净
const dark: MantineColorsTuple = [
  '#c1c9d6',
  '#a6afc0',
  '#8b94a7',
  '#565d6e',
  '#343a48',
  '#272b36',
  '#20232c',
  '#171920',
  '#12141a',
  '#0c0e12',
];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  colors: { brand, dark },

  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  fontFamilyMonospace:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",

  defaultRadius: 'md',
  cursorType: 'pointer',
  headings: { fontWeight: '700' },

  components: {
    Paper: {
      defaultProps: { shadow: 'xs' },
      // 默认背景跟随 --mantine-color-body（与页面底色相同），这里改用表面色
      // 使浅色模式（页面 #f3f5fa / 卡片 #fff）和深色模式（页面 #101218 / 卡片 dark-6）都形成层次
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-default)',
        },
      },
    },
    Button: {
      styles: {
        root: {
          transition:
            'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease, transform 100ms ease',
          '&:active:not(:disabled)': {
            transform: 'translateY(1px)',
          },
        },
      },
    },
    NavLink: {
      defaultProps: { variant: 'light' },
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
          padding: '9px 12px',
          transition: 'background-color 120ms ease, color 120ms ease',
          '&[dataActive]': {
            backgroundColor: 'var(--mantine-primary-color-light)',
            color: 'var(--mantine-primary-color-light-color)',
            fontWeight: 600,
            boxShadow: 'inset 3px 0 0 var(--mantine-primary-color-filled)',
          },
        },
        label: {
          fontSize: 'var(--mantine-font-size-sm)',
        },
      },
    },
    Table: {
      defaultProps: { verticalSpacing: 'sm' },
      styles: {
        th: {
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: 'var(--mantine-color-dimmed)',
        },
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 4 },
      },
      styles: {
        title: { fontWeight: 600 },
      },
    },
    Menu: {
      defaultProps: { radius: 'md', shadow: 'md' },
    },
    Tooltip: {
      defaultProps: { withArrow: true },
    },
    Badge: {
      defaultProps: { radius: 'sm' },
    },
    Notification: {
      styles: {
        root: {
          border: '1px solid var(--mantine-color-default-border)',
          boxShadow: 'var(--mantine-shadow-lg)',
        },
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          transition: 'color 120ms ease, border-color 120ms ease',
        },
      },
    },
    Anchor: {
      defaultProps: { underline: 'hover' },
    },
  },
});
