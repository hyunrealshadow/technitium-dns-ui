import type { QueryLogEntry } from './types';

export function getRowColor(entry: QueryLogEntry): string | undefined {
  // 只保留轻微分类提示，避免数据密集时整张表形成大面积彩色条纹。
  const tint = (color: string) =>
    `color-mix(in srgb, var(--mantine-color-${color}-6) 3.5%, transparent)`;
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
