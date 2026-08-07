import { createFileRoute } from '@tanstack/react-router';
import { LogsPage } from '../../pages/Logs';

export const Route = createFileRoute('/_authenticated/logs/query')({
  component: () => <LogsPage tab="query" />,
  validateSearch: (search: Record<string, unknown>) => ({
    domain: typeof search.domain === 'string' ? search.domain : undefined,
    clientIp: typeof search.clientIp === 'string' ? search.clientIp : undefined,
  }),
});
