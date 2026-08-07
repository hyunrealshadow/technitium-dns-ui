import { createFileRoute } from '@tanstack/react-router';
import { LogsPage } from '../../pages/Logs';

export const Route = createFileRoute('/_authenticated/logs/view')({
  component: () => <LogsPage tab="view" />,
});
