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
  focusRing: 'auto',
  respectReducedMotion: true,
  radius: {
    xs: '4px',
    sm: '6px',
    md: '9px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 8px 24px rgba(15, 23, 42, 0.08)',
    lg: '0 16px 40px rgba(15, 23, 42, 0.11)',
    xl: '0 24px 64px rgba(15, 23, 42, 0.14)',
  },
  headings: {
    fontWeight: '700',
    sizes: {
      h2: { fontSize: '1.75rem', lineHeight: '1.25' },
      h3: { fontSize: '1.25rem', lineHeight: '1.35' },
    },
  },

  components: {
    Paper: {
      defaultProps: { shadow: 'xs', radius: 'lg' },
      // 默认背景跟随 --mantine-color-body（与页面底色相同），这里改用表面色
      // 使浅色模式（页面浅灰 / 卡片白）和深色模式（页面 dark-8 / 卡片 dark-6）都形成层次
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-default)',
          borderColor: 'var(--app-border-color)',
        },
      },
    },
    Button: {
      defaultProps: { radius: 'md' },
      styles: {
        root: {
          fontWeight: 600,
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
          borderRadius: 'var(--mantine-radius-lg)',
          padding: '9px 10px',
          transition: 'background-color 120ms ease, color 120ms ease',
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
          fontWeight: 650,
          letterSpacing: '0.025em',
          color: 'var(--mantine-color-dimmed)',
        },
      },
    },
    ActionIcon: {
      defaultProps: { radius: 'md' },
    },
    Input: {
      defaultProps: { radius: 'md' },
    },
    InputWrapper: {
      styles: {
        label: { fontWeight: 600 },
        description: { lineHeight: 1.45 },
      },
    },
    SegmentedControl: {
      defaultProps: { radius: 'md' },
      styles: {
        label: { fontWeight: 600 },
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: { backgroundOpacity: 0.55, blur: 4 },
      },
      styles: {
        content: {
          backgroundColor: 'var(--mantine-color-default)',
          border: '1px solid var(--app-border-color)',
          boxShadow: 'var(--mantine-shadow-lg)',
        },
        header: {
          backgroundColor: 'var(--mantine-color-default)',
          paddingBottom: 'var(--mantine-spacing-sm)',
        },
        body: { backgroundColor: 'var(--mantine-color-default)' },
        title: { fontWeight: 650 },
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
          fontWeight: 600,
          transition: 'color 120ms ease, border-color 120ms ease',
        },
      },
    },
    Anchor: {
      defaultProps: { underline: 'hover' },
    },
  },
});
