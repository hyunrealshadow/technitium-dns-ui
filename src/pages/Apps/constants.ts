import type { DnsApp } from './types';

export const TYPE_LABELS: { key: keyof DnsApp; label: string; color: string }[] = [
  { key: 'isAppRecordRequestHandler', label: 'apps.types.appRecord', color: 'blue' },
  { key: 'isRequestController', label: 'apps.types.requestController', color: 'grape' },
  { key: 'isAuthoritativeRequestHandler', label: 'apps.types.authoritative', color: 'cyan' },
  { key: 'isRequestBlockingHandler', label: 'apps.types.blocking', color: 'orange' },
  { key: 'isQueryLogger', label: 'apps.types.queryLogger', color: 'teal' },
  { key: 'isQueryLogs', label: 'apps.types.queryLogs', color: 'lime' },
  { key: 'isPostProcessor', label: 'apps.types.postProcessor', color: 'pink' },
];

export function getTypeLabels(dnsApp: DnsApp, t: (key: string) => string) {
  const matched = TYPE_LABELS.filter(l => dnsApp[l.key]);
  if (matched.length === 0) {
    return [{ label: t('apps.types.generic'), color: 'gray' }];
  }
  return matched.map(l => ({ label: t(l.label), color: l.color }));
}
