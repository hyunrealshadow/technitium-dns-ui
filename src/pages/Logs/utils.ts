import type { QueryLogEntry } from './types';

export function getRowColor(entry: QueryLogEntry): string | undefined {
  // 用主题色低透明度混合（8%），深浅模式都柔和，避免整行铺满饱和色
  const tint = (color: string) =>
    `color-mix(in srgb, var(--mantine-color-${color}-6) 8%, transparent)`;
  switch (entry.rcode.toLowerCase()) {
    case 'serverfailure':
      return tint('red');
    case 'nxdomain':
      if (
        ['blocked', 'upstreamblocked', 'upstreamblockedcached'].includes(
          entry.responseType.toLowerCase()
        )
      )
        return tint('orange');
      return tint('gray');
    case 'refused':
      return tint('cyan');
    default:
      switch (entry.responseType.toLowerCase()) {
        case 'authoritative':
          return tint('yellow');
        case 'recursive':
          return tint('cyan');
        case 'cached':
          return tint('grape');
        case 'blocked':
        case 'upstreamblocked':
        case 'upstreamblockedcached':
          return tint('orange');
        default:
          return undefined;
      }
  }
}
