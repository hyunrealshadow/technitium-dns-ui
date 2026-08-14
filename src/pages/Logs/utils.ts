import type { QueryLogEntry } from './types';

export type QueryLogRowTone =
  | 'server-failure'
  | 'nx-domain'
  | 'refused'
  | 'authoritative'
  | 'recursive'
  | 'cached'
  | 'blocked';

/**
 * Match the legacy console's row-color priority while exposing semantic tones
 * that can be adapted independently for light and dark themes.
 */
export function getQueryLogRowTone(entry: QueryLogEntry): QueryLogRowTone | undefined {
  switch (entry.rcode.toLowerCase()) {
    case 'serverfailure':
      return 'server-failure';
    case 'nxdomain':
      return ['blocked', 'upstreamblocked', 'upstreamblockedcached'].includes(
        entry.responseType.toLowerCase()
      )
        ? 'blocked'
        : 'nx-domain';
    case 'refused':
      return 'refused';
    default:
      switch (entry.responseType.toLowerCase()) {
        case 'authoritative':
          return 'authoritative';
        case 'recursive':
          return 'recursive';
        case 'cached':
          return 'cached';
        case 'blocked':
        case 'upstreamblocked':
        case 'upstreamblockedcached':
          return 'blocked';
        default:
          return undefined;
      }
  }
}
