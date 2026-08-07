import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/logs')({
  component: Outlet,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      domain: typeof search.domain === 'string' ? search.domain : undefined,
      clientIp: typeof search.clientIp === 'string' ? search.clientIp : undefined,
    };
  },
});
