import { createFileRoute } from '@tanstack/react-router';
import { DnsClientPage } from '../../pages/DnsClient';

export const Route = createFileRoute('/_authenticated/dns-client')({
  component: DnsClientPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      domain: typeof search.domain === 'string' ? search.domain : undefined,
      type: typeof search.type === 'string' ? search.type : undefined,
    };
  },
});
