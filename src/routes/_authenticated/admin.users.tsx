import { createFileRoute } from '@tanstack/react-router';
import { AdminPage } from '../../pages/Admin';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: () => <AdminPage tab="users" />,
});
