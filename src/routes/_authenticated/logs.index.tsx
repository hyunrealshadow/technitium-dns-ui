import { createFileRoute } from '@tanstack/react-router';
import { LogsPage } from '../../pages/Logs';

export const Route = createFileRoute('/_authenticated/logs/')({
  component: () => <LogsPage tab="view" />,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      domain: typeof search.domain === 'string' ? search.domain : undefined,
      clientIp: typeof search.clientIp === 'string' ? search.clientIp : undefined,
    };
  },
});
