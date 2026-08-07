import { createFileRoute } from '@tanstack/react-router';
import { AdminPage } from '../../pages/Admin';

export const Route = createFileRoute('/_authenticated/admin/permissions')({
  component: () => <AdminPage tab="permissions" />,
});
